import Dexie, { Table } from 'dexie';

export class TrekkerWebDB extends Dexie {
  notes!: Table<any, string>;
  habits!: Table<any, string>;
  events!: Table<any, string>;
  widgets!: Table<any, string>;
  edges!: Table<any, string>;
  containers!: Table<any, string>;

  constructor() {
    super('TrekkerWebDB');
    this.version(1).stores({
      notes: 'id, resourceType, resourceDate, createdAt', 
      habits: 'id, createdAt',
      events: 'id, start, end, createdAt',
      widgets: 'id, containerId, type, dataSourceId, createdAt',
      edges: 'id, containerId',
      containers: 'id, type'
    });
  }
}

export const db = new TrekkerWebDB();
