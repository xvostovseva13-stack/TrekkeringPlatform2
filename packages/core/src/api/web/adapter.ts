import { TrekkerAPI } from '../interface';
import { db } from './db';

const generateId = () => crypto.randomUUID();

// Helper to get enriched widgets (for note/habit usedIn)
const getEnrichedData = async (items: any[]) => {
    const widgets = await db.widgets.toArray();
    // Get containers to know types
    const containers = await db.containers.toArray();
    
    return items.map(item => {
        const linkedWidgets = widgets.filter(w => w.dataSourceId === item.id);
        const usedIn = linkedWidgets.map(w => {
            const container = containers.find(c => c.id === w.containerId);
            return {
                widgetId: w.id,
                containerType: container?.type || 'unknown',
                containerTitle: container?.title || 'Unknown'
            };
        });
        return { ...item, usedIn };
    });
};

export const webAdapter: TrekkerAPI = {
  notes: {
    getAll: async (filter) => {
      let notes = await db.notes.orderBy('createdAt').toArray();
      // Filter logic
      if (filter?.resourceType) {
          notes = notes.filter(n => n.resourceType === filter.resourceType);
      }
      return getEnrichedData(notes);
    },
    create: async (data) => {
      const id = generateId();
      const now = new Date();
      const note = { ...data, id, createdAt: now, updatedAt: now };
      await db.notes.add(note);
      return note;
    },
    update: async ({ id, ...data }) => {
      await db.notes.update(id, { ...data, updatedAt: new Date() });
      return await db.notes.get(id);
    },
    delete: async ({ id }) => {
      // Delete linked widgets
      const widgets = await db.widgets.where('dataSourceId').equals(id).toArray();
      await db.widgets.bulkDelete(widgets.map(w => w.id));
      return await db.notes.delete(id);
    }
  },
  habits: {
    getAll: async () => {
        const habits = await db.habits.orderBy('createdAt').reverse().toArray();
        return getEnrichedData(habits);
    },
    create: async (data) => {
        const id = generateId();
        const now = new Date();
        const habit = { ...data, id, completedDates: '[]', createdAt: now, updatedAt: now };
        await db.habits.add(habit);
        return habit;
    },
    update: async ({ id, ...data }) => {
        await db.habits.update(id, { ...data, updatedAt: new Date() });
        return await db.habits.get(id);
    },
    delete: async ({ id }) => {
        const widgets = await db.widgets.where('dataSourceId').equals(id).toArray();
        await db.widgets.bulkDelete(widgets.map(w => w.id));
        return await db.habits.delete(id);
    }
  },
  events: {
    getAll: async () => await db.events.orderBy('start').toArray(),
    create: async (data) => {
        const id = generateId();
        const now = new Date();
        const event = { ...data, id, createdAt: now, updatedAt: now };
        await db.events.add(event);
        return event;
    },
    update: async ({ id, ...data }) => {
        await db.events.update(id, { ...data, updatedAt: new Date() });
        return await db.events.get(id);
    },
    delete: async ({ id }) => {
        const widgets = await db.widgets.where('dataSourceId').equals(id).toArray();
        await db.widgets.bulkDelete(widgets.map(w => w.id));
        return await db.events.delete(id);
    }
  },
  widgets: {
    create: async ({ type, position, settings, dataSourceId }) => {
        // Ensure container
        let container = await db.containers.where('type').equals('canvas').first();
        if (!container) {
            container = { id: generateId(), type: 'canvas', title: 'Main Canvas', createdAt: new Date(), updatedAt: new Date() };
            await db.containers.add(container);
        }

        const id = generateId();
        const now = new Date();
        const widget = { 
            id, 
            containerId: container.id, 
            type, 
            position: JSON.stringify(position), 
            settings: JSON.stringify(settings || {}), 
            dataSourceId, 
            createdAt: now, 
            updatedAt: now 
        };
        await db.widgets.add(widget);
        return widget;
    },
    getAll: async () => {
        const container = await db.containers.where('type').equals('canvas').first();
        if (!container) return [];
        const widgets = await db.widgets.where('containerId').equals(container.id).toArray();
        
        // Enrich with data
        return Promise.all(widgets.map(async (w) => {
            if (w.dataSourceId) {
                if (w.type === 'note') {
                    const note = await db.notes.get(w.dataSourceId);
                    if (note) return { ...w, data: note };
                } else if (w.type === 'event') {
                    const event = await db.events.get(w.dataSourceId);
                    if (event) return { ...w, data: event };
                } else if (w.type === 'habit') {
                    // Habits usually don't embed data in widget list, but if needed:
                    // const habit = await db.habits.get(w.dataSourceId);
                }
            }
            return w;
        }));
    },
    delete: async ({ id }) => {
        // Delete edges
        const edges = await db.edges.filter(e => e.source === id || e.target === id).toArray();
        await db.edges.bulkDelete(edges.map(e => e.id));
        return await db.widgets.delete(id);
    },
    updatePosition: async (id, position) => {
        return await db.widgets.update(id, { position: JSON.stringify(position), updatedAt: new Date() });
    },
    update: async ({ id, ...data }) => {
        const updateData: any = { updatedAt: new Date() };
        if (data.dataSourceId !== undefined) updateData.dataSourceId = data.dataSourceId;
        if (data.settings) updateData.settings = JSON.stringify(data.settings);
        return await db.widgets.update(id, updateData);
    },
    getRecent: async ({ type, limit }) => {
        const l = limit || 3;
        if (type === 'note') return await db.notes.orderBy('createdAt').reverse().limit(l).toArray();
        if (type === 'habit') return await db.habits.orderBy('createdAt').reverse().limit(l).toArray();
        if (type === 'event') return await db.events.orderBy('createdAt').reverse().limit(l).toArray();
        return [];
    }
  },
  edges: {
    getAll: async () => {
        const container = await db.containers.where('type').equals('canvas').first();
        if (!container) return [];
        return await db.edges.where('containerId').equals(container.id).toArray();
    },
    create: async (data) => {
        const container = await db.containers.where('type').equals('canvas').first();
        if (!container) throw new Error("No container");
        const id = generateId();
        await db.edges.add({ ...data, id, containerId: container.id, createdAt: new Date(), updatedAt: new Date() });
        return { id, ...data };
    },
    delete: async ({ id }) => await db.edges.delete(id)
  },
  containers: {
    getSettings: async ({ type }) => {
        const c = await db.containers.where('type').equals(type).first();
        return c?.settings ? JSON.parse(c.settings) : null;
    },
    updateSettings: async ({ type, settings }) => {
        let c = await db.containers.where('type').equals(type).first();
        const strSettings = JSON.stringify(settings);
        if (c) {
            await db.containers.update(c.id, { settings: strSettings, updatedAt: new Date() });
        } else {
            await db.containers.add({ 
                id: generateId(), 
                type, 
                title: `Main ${type}`, 
                settings: strSettings, 
                createdAt: new Date(), 
                updatedAt: new Date() 
            });
        }
        return true;
    }
  }
};
