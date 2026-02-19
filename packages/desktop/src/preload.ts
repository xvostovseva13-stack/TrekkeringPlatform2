import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    getNotes: (filter?: { resourceType?: string, resourceDate?: Date, start?: Date, end?: Date }) => ipcRenderer.invoke('db:getNotes', filter),
    createNote: (data: { title: string, content: string, color?: string, resourceType?: string, resourceDate?: Date }) => ipcRenderer.invoke('db:createNote', data),
    updateNote: (data: { id: string, title?: string, content?: string, color?: string }) => ipcRenderer.invoke('db:updateNote', data),
    deleteNote: (data: { id: string }) => ipcRenderer.invoke('db:deleteNote', data),
    
    createWidget: (data: { type: string, position: {x: number, y: number}, settings?: any, dataSourceId?: string }) => 
      ipcRenderer.invoke('db:createWidget', data),
    getWidgets: () => ipcRenderer.invoke('db:getWidgets'),
    deleteWidget: (data: { id: string }) => ipcRenderer.invoke('db:deleteWidget', data),
    updateWidgetPosition: (id: string, position: { x: number, y: number }) => 
      ipcRenderer.invoke('db:updateWidgetPosition', { id, position }),
    updateWidget: (data: { id: string, dataSourceId?: string, settings?: any }) => 
      ipcRenderer.invoke('db:updateWidget', data),

    getEdges: () => ipcRenderer.invoke('db:getEdges'),
    createEdge: (data: { source: string, target: string, sourceHandle?: string, targetHandle?: string }) => 
      ipcRenderer.invoke('db:createEdge', data),
    deleteEdge: (data: { id: string }) => ipcRenderer.invoke('db:deleteEdge', data),

    getContainerSettings: (data: { type: string }) => 
      ipcRenderer.invoke('db:getContainerSettings', data),
    updateContainerSettings: (data: { type: string, settings: any }) => 
      ipcRenderer.invoke('db:updateContainerSettings', data),

    // Calendar Events
    getEvents: () => ipcRenderer.invoke('db:getEvents'),
    createEvent: (data: { title: string, start: Date, end: Date, allDay?: boolean, description?: string, color?: string }) => 
      ipcRenderer.invoke('db:createEvent', data),
    updateEvent: (data: { id: string, title?: string, start?: Date, end?: Date, allDay?: boolean, description?: string, color?: string }) => 
      ipcRenderer.invoke('db:updateEvent', data),
    deleteEvent: (data: { id: string }) => ipcRenderer.invoke('db:deleteEvent', data),

    // Habits
    getHabits: () => ipcRenderer.invoke('db:getHabits'),
    createHabit: (data: { title: string, description?: string, frequency?: string }) => 
      ipcRenderer.invoke('db:createHabit', data),
    updateHabit: (data: { id: string, title?: string, description?: string, frequency?: string, completedDates?: string }) => 
      ipcRenderer.invoke('db:updateHabit', data),
    deleteHabit: (data: { id: string }) => ipcRenderer.invoke('db:deleteHabit', data),

    // Recent Items
    getRecentItems: (data: { type: string, limit?: number }) => 
      ipcRenderer.invoke('db:getRecentItems', data)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...api
    })
    // Also expose api directly just in case electronAPI doesn't cover it the way we want
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}