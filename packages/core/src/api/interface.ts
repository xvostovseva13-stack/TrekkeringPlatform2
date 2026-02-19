export interface TrekkerAPI {
  notes: {
    getAll: (filter?: { resourceType?: string, resourceDate?: Date, start?: Date, end?: Date }) => Promise<any[]>;
    create: (data: { title: string, content: string, color?: string, resourceType?: string, resourceDate?: Date }) => Promise<any>;
    update: (data: { id: string, title?: string, content?: string, color?: string }) => Promise<any>;
    delete: (data: { id: string }) => Promise<any>;
  };
  habits: {
    getAll: () => Promise<any[]>;
    create: (data: { title: string, description?: string, frequency?: string }) => Promise<any>;
    update: (data: { id: string, title?: string, description?: string, frequency?: string, completedDates?: string }) => Promise<any>;
    delete: (data: { id: string }) => Promise<any>;
  };
  events: {
    getAll: () => Promise<any[]>;
    create: (data: { title: string, start: Date, end: Date, allDay?: boolean, description?: string, color?: string }) => Promise<any>;
    update: (data: { id: string, title?: string, start?: Date, end?: Date, allDay?: boolean, description?: string, color?: string }) => Promise<any>;
    delete: (data: { id: string }) => Promise<any>;
  };
  widgets: {
    create: (data: { type: string, position: {x: number, y: number}, settings?: any, dataSourceId?: string }) => Promise<any>;
    getAll: () => Promise<any[]>;
    delete: (data: { id: string }) => Promise<any>;
    updatePosition: (id: string, position: { x: number, y: number }) => Promise<any>;
    update: (data: { id: string, dataSourceId?: string, settings?: any }) => Promise<any>;
    getRecent: (data: { type: string, limit?: number }) => Promise<any[]>;
  };
  edges: {
    getAll: () => Promise<any[]>;
    create: (data: { source: string, target: string, sourceHandle?: string, targetHandle?: string }) => Promise<any>;
    delete: (data: { id: string }) => Promise<any>;
  };
  containers: {
    getSettings: (data: { type: string }) => Promise<any>;
    updateSettings: (data: { type: string, settings: any }) => Promise<any>;
  };
}
