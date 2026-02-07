export {};

declare global {
  interface Window {
    electron: {
      db: {
        getNotes: (filter?: { resourceType?: string, resourceDate?: Date }) => Promise<any[]>;
        createNote: (data: { title: string, content: string, color?: string, resourceType?: string, resourceDate?: Date }) => Promise<any>;
        updateNote: (data: { id: string, title?: string, content?: string, color?: string }) => Promise<any>;
        deleteNote: (data: { id: string }) => Promise<any>;
        createWidget: (data: { type: string, position: {x: number, y: number}, settings?: any, dataSourceId?: string }) => Promise<any>;
        getWidgets: () => Promise<any[]>;
        deleteWidget: (data: { id: string }) => Promise<any>;
        updateWidgetPosition: (id: string, position: { x: number, y: number }) => Promise<any>;
        // Calendar Events
        getEvents: () => Promise<any[]>;
        createEvent: (data: { title: string, start: Date, end: Date, allDay?: boolean, description?: string }) => Promise<any>;
      }
    }
  }
}