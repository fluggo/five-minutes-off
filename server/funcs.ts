import * as aws from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import * as d3timeFormat from 'd3-time-format';
import { reject } from 'async';
import uuidv1 = require('uuid/v1');

// Use Bluebird promises for their async stack trace ability
import * as BluebirdPromise from 'bluebird';
global.Promise = BluebirdPromise;
aws.config.setPromisesDependency(BluebirdPromise);
class ServerError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    Error.captureStackTrace(this, ServerError);
    this.code = code;
  }
}

const isoWeekParser = d3timeFormat.timeParse('%Y-W%V');

const db = new aws.DynamoDB({apiVersion: '2012-08-10', endpoint: 'http://localhost:8000', region: 'us-west-2'});
const docClient = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10', endpoint: 'http://localhost:8000', region: 'us-west-2'});

const WEEKS_TABLE = 'Weeks';
const ACCOUNTS_TABLE = 'Accounts';

export interface AccountRecord {
  accountID: string;
  recentPositiveReasons: string[];
  recentNegativeReasons: string[];
}

export interface TimeRecord {
  /** Number of minutes added (or removed). Cannot be zero. */
  minutesAdded: number;

  /** The reason for the addition or removal. Cannot be empty. */
  reason: string;

  /** The date the infraction took place. */
  time: string;
}

export interface WeekRecord {
  accountID: string;

  /** ISO 8601 week (e.g. "2018-W03"). */
  weekID: string;

  /** Number of minutes initially granted. */
  minutesGranted: number;

  /** Changes made for this week. */
  changes: TimeRecord[];

  /** UUID for this update for optimistic concurrency. */
  updateID: string;
}

export function createAccountsTable() {
  return db.createTable({
    TableName: ACCOUNTS_TABLE,
    KeySchema: [
      { AttributeName: 'accountID', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'accountID', AttributeType: 'S' },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 20, WriteCapacityUnits: 5 }
  }).promise();
}

export function createWeeksTable() {
  return db.createTable({
    TableName: WEEKS_TABLE,
    KeySchema: [
      { AttributeName: 'accountID', KeyType: 'HASH' },
      { AttributeName: 'weekID', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'accountID', AttributeType: 'S' },
      { AttributeName: 'weekID', AttributeType: 'S' },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 20, WriteCapacityUnits: 5 }
  }).promise();
}

export function deleteWeeksTable() {
  return db.deleteTable({ TableName: WEEKS_TABLE }).promise();
}

export function deleteAccountsTable() {
  return db.deleteTable({ TableName: ACCOUNTS_TABLE }).promise();
}

export function getRecentReasons(accountID: string, positive: boolean, from: number, size: number): Promise<string[]> {
  if(from < 0 || size <= 0)
    return Promise.reject(new ServerError('From or size parameters invalid.', 'params-invalid'));

  const REASONS_ATTRIBUTE = positive ? 'recentPositiveReasons' : 'recentNegativeReasons';

  return docClient.get({
    TableName: ACCOUNTS_TABLE,
    Key: { 'accountID': accountID },
    ProjectionExpression: REASONS_ATTRIBUTE,
  }).promise().then(
    response => {
      if(!response.Item)
        return Promise.reject(new ServerError('Account not found.', 'account-not-found'));

      const reasons: string[] = response.Item[REASONS_ATTRIBUTE];
      const counts = reasons.reduce((map, reason) => {
        map.set(reason, (map.get(reason) || 0) + 1);
        return map;
      }, new Map<string, number>());

      const result = Array.from(counts.entries()).sort((a, b) => (a[1] > b[1]) ? -1 : ((a[1] < b[1]) ? 1 : 0)).slice(from, from + size).map(r => r[0]);
      return Promise.resolve(result);
    }
  );
}

export function createAccount(accountID: string): Promise<void> {
  const account: AccountRecord = {
    accountID: accountID,
    recentPositiveReasons: [],
    recentNegativeReasons: [],
  };

  return docClient.put({
    TableName: ACCOUNTS_TABLE,
    Item: account,
    ConditionExpression: 'attribute_not_exists(accountID)',
  }).promise().then(
    response => Promise.resolve(),
    err => {
      if(err.code === 'ConditionalCheckFailedException')
        return Promise.reject(new ServerError('Account already exists.', 'account-exists'));

      return Promise.reject(err);
    }
  );
}

/**
 * Determines whether the given account name exists.
 * accountID: Account to check.
 */
async function checkAccount(accountID: string): Promise<boolean> {
  const response = await docClient.get({ TableName: ACCOUNTS_TABLE, Key: { accountID: accountID }, ProjectionExpression: 'accountID' }).promise();
  return !!response.Item;
}

export function addTime(accountID: string, weekID: string, minutes: number, reason: string): Promise<WeekRecord> {
  // Ensure week is valid
  if(!isoWeekParser(weekID))
    return Promise.reject(new ServerError('Invalid week specifier.', 'invalid-week'));

  minutes = Math.floor(minutes);
  reason = reason.trim();

  if(minutes === 0)
    return Promise.reject(new ServerError('Minutes cannot be zero.', 'missing-minutes'));

  if(reason === '')
    return Promise.reject(new ServerError('Reason cannot be empty.', 'missing-reason'));

  return docClient.get({
    TableName: WEEKS_TABLE,
    Key: {
      accountID: accountID,
      weekID: weekID,
    }
  }).promise().then(
    response => {
      if(!response.Item)
        return Promise.reject(new ServerError('Week has not been set up yet.', 'week-missing'));
      
      const week = response.Item as WeekRecord;

      // Ensure we don't go negative
      const minutesLeft = week.changes.reduce<number>((count, record) => count + record.minutesAdded, week.minutesGranted);

      if(minutesLeft + minutes < 0)
        return Promise.reject(new ServerError(`Cannot take away ${-minutes} minutes with only ${minutesLeft} minutes remaining.`, 'insufficient-time'));

      // Checks done, make the change happen
      week.changes.push({ reason: reason, minutesAdded: minutes, time: d3timeFormat.isoFormat(new Date()) });

      return docClient.update({
        TableName: WEEKS_TABLE,
        Key: {
          accountID: accountID,
          weekID: weekID
        },
        UpdateExpression: 'set changes = list_append(changes, :c)',
        ExpressionAttributeValues: {
          ':c': [{ reason: reason, minutesAdded: minutes, time: d3timeFormat.isoFormat(new Date()) }]
        },
      }).promise().then(updateResponse => {
        // Update the recently used reason list
        return addReason(accountID, minutes > 0, reason).then(a => week);
      });
    }
  );
}

function addReason(accountID: string, positive: boolean, reason: string): Promise<void> {
  const REASONS_ATTRIBUTE = positive ? 'recentPositiveReasons' : 'recentNegativeReasons';
  const REASONS_TO_KEEP = 100;

  return docClient.get({
    TableName: ACCOUNTS_TABLE,
    Key: { 'accountID': accountID },
    ProjectionExpression: REASONS_ATTRIBUTE,
  }).promise().then(
    response => {
      if(!response.Item)
        return Promise.reject(new ServerError('Account not found.', 'account-not-found'));

      // Amend the list and remove old entries
      const reasons: string[] = response.Item[REASONS_ATTRIBUTE];
      reasons.push(reason);

      if(reasons.length > REASONS_TO_KEEP)
        reasons.shift();

      return docClient.update({
        TableName: ACCOUNTS_TABLE,
        Key: {
          accountID: accountID,
        },
        UpdateExpression: 'set #reasons = :c',
        ExpressionAttributeNames: { '#reasons': REASONS_ATTRIBUTE },
        ExpressionAttributeValues: { ':c': reasons }
      }).promise().then(() => Promise.resolve());
    }
  );
}

export async function setWeek(accountID: string, weekID: string, minutesGranted: number): Promise<WeekRecord> {
  minutesGranted = Math.floor(minutesGranted);

  if(minutesGranted < 0)
    throw new ServerError(`Can't grant less than zero minutes.`, 'insufficient-time');

  // Ensure week is valid
  if(!isoWeekParser(weekID))
    throw new ServerError('Invalid week specifier.', 'invalid-week');

  if(!(await checkAccount(accountID)))
    throw new ServerError('Invalid account.', 'account-not-found');

  let week: WeekRecord = {
    accountID: accountID,
    weekID: weekID,
    minutesGranted: minutesGranted,
    changes: [],
    updateID: uuidv1(),
  };

  try {
    await docClient.put({
      TableName: WEEKS_TABLE,
      Item: week,
      ConditionExpression: 'attribute_not_exists(weekID)',
    }).promise();

    return week;
  }
  catch(errObj) {
    const err = errObj as AWSError;

    if(err.code !== 'ConditionalCheckFailedException')
      throw err;

    // The week exists already, so verify we won't set an invalid result
    const response = await docClient.get({ TableName: WEEKS_TABLE, Key: { accountID: accountID, weekID: weekID }, ConsistentRead: true }).promise();
    week = response.Item as WeekRecord;

    // Ensure we don't go negative
    const minutesLeft = week.changes.reduce((count, record) => count + record.minutesAdded, minutesGranted);

    if(minutesLeft < 0)
      throw new ServerError(`Granting that much time for the week would put the total time for the week less than zero.`, 'insufficient-time');

    const oldUpdateID = week.updateID;

    week.minutesGranted = minutesGranted;
    week.updateID = uuidv1();

    await docClient.put({
      TableName: WEEKS_TABLE,
      Item: week,
      ConditionExpression: 'updateID = :uuid',
      ExpressionAttributeValues: {
        ':uuid': oldUpdateID,
      }
    }).promise();

    return week;
  }
}

export async function getWeek(accountID: string, weekID: string): Promise<WeekRecord> {
  // Ensure week is valid
  if(!isoWeekParser(weekID))
    throw new ServerError('Invalid week specifier.', 'invalid-week');

  const response = await docClient.get({
    TableName: WEEKS_TABLE,
    Key: { accountID: accountID, weekID: weekID },
  }).promise();

  return response.Item as WeekRecord;
}

