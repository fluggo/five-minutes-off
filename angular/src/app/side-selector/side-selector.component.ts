import { Component, OnInit, OnChanges, EventEmitter, Input, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';

export interface Item {
  text: string;
  color: string | number;
  tag?: any;
}

export type GetRelatedItemFunc = (item: Item) => Item;

@Component({
  selector: 'app-side-selector',
  templateUrl: './side-selector.component.html',
  styleUrls: ['./side-selector.component.css']
})
export class SideSelectorComponent implements OnInit, OnChanges {
  @Output() previousClicked = new EventEmitter<boolean>();
  @Output() nextClicked = new EventEmitter<boolean>();
  @Input() itemTemplate: TemplateRef<any>;
  @ViewChild('defaultTemplate') defaultTemplate: TemplateRef<any>;
  @Input() currentItem: {} | undefined;
  @Input() nextAvailable = true;
  @Input() prevAvailable = true;
  goingForward = true;
  templateContext = { $implicit: '' };

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if('currentItem' in changes) {
      if(!changes['currentItem'].firstChange) {
        // Do animation here
      }

      this.templateContext.$implicit = changes['currentItem'].currentValue;
    }

    if(!this.itemTemplate)
      this.itemTemplate = this.defaultTemplate;
  }

  next() {
    this.nextClicked.emit(true);
    this.goingForward = true;
  }

  previous() {
    this.previousClicked.emit(false);
    this.goingForward = false;
  }
}
