export {};

declare global {
  interface Window {
    electron: {
      db: {
        getNotes: (filter?: { resourceType?: string, resourceDate?: Date, start?: Date, end?: Date }) => Promise<any[]>;
        createNote: (data: { title: string, content: string, color?: string, resourceType?: string, resourceDate?: Date }) => Promise<any>;
        updateNote: (data: { id: string, title?: string, content?: string, color?: string }) => Promise<any>;
        deleteNote: (data: { id: string }) => Promise<any>;
        createWidget: (data: { type: string, position: {x: number, y: number}, settings?: any, dataSourceId?: string }) => Promise<any>;
        getWidgets: () => Promise<any[]>;
        deleteWidget: (data: { id: string }) => Promise<any>;
        updateWidgetPosition: (id: string, position: { x: number, y: number }) => Promise<any>;
        updateWidget: (data: { id: string, dataSourceId?: string, settings?: any }) => Promise<any>;
        getEdges: () => Promise<any[]>;
        createEdge: (data: { source: string, target: string, sourceHandle?: string, targetHandle?: string }) => Promise<any>;
        deleteEdge: (data: { id: string }) => Promise<any>;
        getContainerSettings: (data: { type: string }) => Promise<any>;
        updateContainerSettings: (data: { type: string, settings: any }) => Promise<any>;
        // Calendar Events
        getEvents: () => Promise<any[]>;
        createEvent: (data: { title: string, start: Date, end: Date, allDay?: boolean, description?: string, color?: string }) => Promise<any>;
        updateEvent: (data: { id: string, title?: string, start?: Date, end?: Date, allDay?: boolean, description?: string, color?: string }) => Promise<any>;
        deleteEvent: (data: { id: string }) => Promise<any>;
        // Habits
        getHabits: () => Promise<any[]>;
        createHabit: (data: { title: string, description?: string, frequency?: string }) => Promise<any>;
        updateHabit: (data: { id: string, title?: string, description?: string, frequency?: string, completedDates?: string }) => Promise<any>;
        deleteHabit: (data: { id: string }) => Promise<any>;
        // Recent Items
        getRecentItems: (data: { type: string, limit?: number }) => Promise<any[]>;
      }
    }
  }
}