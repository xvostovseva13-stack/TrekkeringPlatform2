import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    getNotes: (filter?: { resourceType?: string, resourceDate?: Date }) => ipcRenderer.invoke('db:getNotes', filter),
    createNote: (data: { title: string, content: string, color?: string, resourceType?: string, resourceDate?: Date }) => ipcRenderer.invoke('db:createNote', data),
    updateNote: (data: { id: string, title?: string, content?: string, color?: string }) => ipcRenderer.invoke('db:updateNote', data),
    deleteNote: (data: { id: string }) => ipcRenderer.invoke('db:deleteNote', data),
    
    createWidget: (data: { type: string, position: {x: number, y: number}, settings?: any, dataSourceId?: string }) => 
      ipcRenderer.invoke('db:createWidget', data),
    getWidgets: () => ipcRenderer.invoke('db:getWidgets'),
    deleteWidget: (data: { id: string }) => ipcRenderer.invoke('db:deleteWidget', data),
    updateWidgetPosition: (id: string, position: { x: number, y: number }) => 
      ipcRenderer.invoke('db:updateWidgetPosition', { id, position }),

    // Calendar Events
    getEvents: () => ipcRenderer.invoke('db:getEvents'),
    createEvent: (data: { title: string, start: Date, end: Date, allDay?: boolean, description?: string }) => 
      ipcRenderer.invoke('db:createEvent', data)
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