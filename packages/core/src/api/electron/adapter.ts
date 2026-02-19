import { TrekkerAPI } from '../interface';

export const electronAdapter: TrekkerAPI = {
  notes: {
    getAll: (filter) => window.electron.db.getNotes(filter),
    create: (data) => window.electron.db.createNote(data),
    update: (data) => window.electron.db.updateNote(data),
    delete: (data) => window.electron.db.deleteNote(data)
  },
  habits: {
    getAll: () => window.electron.db.getHabits(),
    create: (data) => window.electron.db.createHabit(data),
    update: (data) => window.electron.db.updateHabit(data),
    delete: (data) => window.electron.db.deleteHabit(data)
  },
  events: {
    getAll: () => window.electron.db.getEvents(),
    create: (data) => window.electron.db.createEvent(data),
    update: (data) => window.electron.db.updateEvent(data),
    delete: (data) => window.electron.db.deleteEvent(data)
  },
  widgets: {
    create: (data) => window.electron.db.createWidget(data),
    getAll: () => window.electron.db.getWidgets(),
    delete: (data) => window.electron.db.deleteWidget(data),
    updatePosition: (id, pos) => window.electron.db.updateWidgetPosition(id, pos),
    update: (data) => window.electron.db.updateWidget(data),
    getRecent: (data) => window.electron.db.getRecentItems(data)
  },
  edges: {
    getAll: () => window.electron.db.getEdges(),
    create: (data) => window.electron.db.createEdge(data),
    delete: (data) => window.electron.db.deleteEdge(data)
  },
  containers: {
    getSettings: (data) => window.electron.db.getContainerSettings(data),
    updateSettings: (data) => window.electron.db.updateContainerSettings(data)
  }
};
