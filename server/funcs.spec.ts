import 'mocha';
import { expect } from 'chai';
import * as async from 'async';
import * as funcs from './funcs';

function cleanUp() {
  return Promise.all([
    funcs.deleteWeeksTable().catch(err => {
      if(err.code === 'ResourceNotFoundException')
        return Promise.resolve();

      return Promise.reject(err);
    }),
    funcs.deleteAccountsTable().catch(err => {
      if(err.code === 'ResourceNotFoundException')
        return Promise.resolve();

      return Promise.reject(err);
    }),
  ])
}

describe('Accounts', function() {
  const ACCOUNT_ID = 'BLAHBLONK';

  describe('createAccount', function() {
    beforeEach(async function() {
      await cleanUp();
      await funcs.createAccountsTable();
    });

    afterEach(function() {
      return cleanUp();
    });

    it('creates an account', function() {
      return funcs.createAccount(ACCOUNT_ID);
    });

    it('fails if the account already exists', async function() {
      await funcs.createAccount(ACCOUNT_ID);

      return funcs.createAccount(ACCOUNT_ID).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('account-exists');
        }
      );
    });
  });

  describe('setWeek', function() {
    beforeEach(async function() {
      await cleanUp();
      await Promise.all([
        funcs.createAccountsTable(),
        funcs.createWeeksTable(),
      ]);
      await funcs.createAccount(ACCOUNT_ID);
    });

    afterEach(function() {
      return cleanUp();
    });

    const WEEK1 = '2018-W05';

    it('sets up a week', async function() {
      const week = await funcs.setWeek(ACCOUNT_ID, WEEK1, 10);

      expect(week.weekID).to.equal(WEEK1);
      expect(week.changes).to.have.lengthOf(0);
      expect(week.minutesGranted).to.equal(10);
      expect(week.updateID).to.exist;
      expect(week.accountID).to.equal(ACCOUNT_ID);
    });

    it("allows zero time", async function() {
      const week = await funcs.setWeek(ACCOUNT_ID, WEEK1, 0);
      expect(week.minutesGranted).to.equal(0);
    });

    it("changes the updateID", async function() {
      const week1 = await funcs.setWeek(ACCOUNT_ID, WEEK1, 100);
      const week2 = await funcs.setWeek(ACCOUNT_ID, WEEK1, 10);

      expect(week1.updateID).to.not.equal(week2.updateID);
    });

    it("fails if a negative time is provided", function() {
      return funcs.setWeek(ACCOUNT_ID, WEEK1, -10).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('insufficient-time');
        }
      );
    });

    it("fails if the weekID is invalid", function() {
      return funcs.setWeek(ACCOUNT_ID, '2018-02-15', 0).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('invalid-week');
        }
      );
    });

    it("fails if the accountID is invalid", function() {
      return funcs.setWeek('skimpopple', WEEK1, 0).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('account-not-found');
        }
      );
    });

    it("fails if time would go negative", async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 100);
      await funcs.addTime(ACCOUNT_ID, WEEK1, -10, 'Not listening');

      // Ensure there is now no time left; this should work
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 10);

      // Try to take the time remaining below zero now
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 0).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('insufficient-time');
        }
      );
    });
  });

  describe('addTime', function() {
    beforeEach(async function() {
      await cleanUp();
      await Promise.all([
        funcs.createAccountsTable(),
        funcs.createWeeksTable(),
      ]);
      await funcs.createAccount(ACCOUNT_ID);
    });

    afterEach(function() {
      return cleanUp();
    });

    const WEEK1 = '2018-W05';

    it('basic usage', async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 300);
      let record1 = await funcs.addTime(ACCOUNT_ID, WEEK1, -5, 'Not listening');

      expect(record1.weekID).to.equal(WEEK1);
      expect(record1.changes).to.have.lengthOf(1);
      expect(record1.changes[0].minutesAdded).to.equal(-5);
      expect(record1.changes[0].reason).to.equal('Not listening');
      expect(record1.changes[0].time).to.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/);
      expect(record1.minutesGranted).to.equal(300);
      expect(record1.updateID).to.exist;
      expect(record1.accountID).to.equal(ACCOUNT_ID);

      record1 = await funcs.getWeek(ACCOUNT_ID, WEEK1);

      expect(record1.weekID).to.equal(WEEK1);
      expect(record1.changes).to.have.lengthOf(1);
      expect(record1.changes[0].minutesAdded).to.equal(-5);
      expect(record1.changes[0].reason).to.equal('Not listening');
      expect(record1.changes[0].time).to.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/);
      expect(record1.minutesGranted).to.equal(300);
      expect(record1.updateID).to.exist;
      expect(record1.accountID).to.equal(ACCOUNT_ID);

      let record2 = await funcs.addTime(ACCOUNT_ID, WEEK1, -295, 'REALLY not listening');

      expect(record2.weekID).to.equal(WEEK1);
      expect(record2.changes).to.have.lengthOf(2);
      expect(record2.changes[0].minutesAdded).to.equal(-5);
      expect(record2.changes[0].reason).to.equal('Not listening');
      expect(record2.changes[0].time).to.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/);
      expect(record2.changes[1].minutesAdded).to.equal(-295);
      expect(record2.changes[1].reason).to.equal('REALLY not listening');
      expect(record2.changes[1].time).to.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/);
      expect(record2.minutesGranted).to.equal(300);
      expect(record2.updateID).to.exist;
      expect(record2.accountID).to.equal(ACCOUNT_ID);
    });

    it("fails if the week isn't set up", function() {
      return funcs.addTime(ACCOUNT_ID, WEEK1, -5, 'Not listening').then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('week-missing');
        }
      );
    });

    it("fails if there isn't enough time", async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 300);

      await funcs.addTime(ACCOUNT_ID, WEEK1, -301, 'Not listening').then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('insufficient-time');
        }
      );
    });
  });

  describe('getRecentReasons', function() {
    beforeEach(async function() {
      await cleanUp();
      await Promise.all([
        funcs.createAccountsTable(),
        funcs.createWeeksTable(),
      ]);
      await funcs.createAccount(ACCOUNT_ID);
    });

    afterEach(function() {
      return cleanUp();
    });

    const WEEK1 = '2018-W05';

    it("fails if the accountID is invalid", function() {
      return funcs.getRecentReasons('skimpopple', false, 0, 10).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('account-not-found');
        }
      );
    });

    it("provides recent negative reasons", async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 100);
      await funcs.addTime(ACCOUNT_ID, WEEK1, -5, "Not listening");
      await funcs.addTime(ACCOUNT_ID, WEEK1, -10, "Not listening");
      await funcs.addTime(ACCOUNT_ID, WEEK1, -5, "Didn't clean up clothes");
      await funcs.addTime(ACCOUNT_ID, WEEK1, 5, "Brushed teeth without being told");

      const reasons = await funcs.getRecentReasons(ACCOUNT_ID, false, 0, 10);

      expect(reasons).to.deep.equal([
        "Not listening",
        "Didn't clean up clothes"
      ]);
    });

    it("provides recent positive reasons", async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 100);
      await funcs.addTime(ACCOUNT_ID, WEEK1, -5, "Not listening");
      await funcs.addTime(ACCOUNT_ID, WEEK1, -10, "Not listening");
      await funcs.addTime(ACCOUNT_ID, WEEK1, -5, "Didn't clean up clothes");
      await funcs.addTime(ACCOUNT_ID, WEEK1, 5, "Brushed teeth without being told");
      await funcs.addTime(ACCOUNT_ID, WEEK1, 5, "Did something awesome");
      await funcs.addTime(ACCOUNT_ID, WEEK1, 5, "Did something awesome");

      const reasons = await funcs.getRecentReasons(ACCOUNT_ID, true, 0, 10);

      expect(reasons).to.deep.equal([
        "Did something awesome",
        "Brushed teeth without being told"
      ]);
    });

    it("rejects invalid parameters", async function() {
      await funcs.setWeek(ACCOUNT_ID, WEEK1, 300);

      await funcs.getRecentReasons(ACCOUNT_ID, false, -1, 10).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('params-invalid');
        }
      );

      await funcs.getRecentReasons(ACCOUNT_ID, false, 0, 0).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('params-invalid');
        }
      );

      await funcs.getRecentReasons(ACCOUNT_ID, false, 0, -1).then(
        () => expect.fail(null, null, 'Expected error'),
        err => {
          expect(err.code).to.equal('params-invalid');
        }
      );
    });
  });
});
