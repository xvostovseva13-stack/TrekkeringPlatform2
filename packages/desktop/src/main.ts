import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';
import * as crypto from 'crypto';

// Disable hardware acceleration to fix cursor rendering issues
app.disableHardwareAcceleration();

// Simple file logger
function log(message: string) {
  try {
    const logPath = join(app.getPath('userData'), 'main.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    console.error("Logging failed", e);
  }
}

log("App starting...");

// Explicitly configure the database URL for SQLite
// In production, this should point to app.getPath('userData')
const dbPath = is.dev 
  ? join(__dirname, '../../trekker.db') // Points to packages/desktop/trekker.db
  : join(app.getPath('userData'), 'trekker.db');

log(`DB Path configured to: ${dbPath}`);

// --- DATABASE INITIALIZATION STRATEGY ---
// In production, check if the database exists and is valid.
// If it doesn't exist OR is smaller than 20KB (likely empty/corrupted),
// copy the pre-migrated 'seed' database from resources.

if (!is.dev) {
  let needsCopy = !fs.existsSync(dbPath);
  
  if (!needsCopy) {
    try {
      const stats = fs.statSync(dbPath);
      if (stats.size < 20 * 1024) { // < 20KB
         log(`Existing DB detected but is too small (${stats.size} bytes). Assuming corruption/empty.`);
         try {
           fs.unlinkSync(dbPath);
           needsCopy = true;
           log("Deleted invalid DB file.");
         } catch (unlinkErr) {
           log(`Failed to delete invalid DB: ${unlinkErr}`);
         }
      }
    } catch (statErr) {
      log(`Error checking DB stats: ${statErr}`);
    }
  }

  if (needsCopy) {
    const sourceDbPath = join(process.resourcesPath, 'trekker.db');
    log(`Copying DB from: ${sourceDbPath} to ${dbPath}`);
    
    try {
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        log("Database copied successfully.");
      } else {
        log("CRITICAL: Source database not found in resources. App starts with empty DB (expect errors).");
      }
    } catch (e) {
      log(`Failed to copy database: ${e}`);
    }
  }
}
// ----------------------------------------

process.env.DATABASE_URL = `file:${dbPath}`;

// Initialize Prisma
// We might need to point to the engine explicitly in production if auto-discovery fails
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
})

// --- MIGRATION RUNNER ---
async function runMigrations() {
  log("Checking for pending migrations...");
  
  // Identify migrations directory
  // In prod: process.resourcesPath/prisma/migrations
  // In dev: ../../prisma/migrations (relative to main.ts)
  const migrationsPath = is.dev 
    ? join(__dirname, '../../prisma/migrations')
    : join(process.resourcesPath, 'prisma/migrations');
    
  log(`Looking for migrations at: ${migrationsPath}`);

  if (!fs.existsSync(migrationsPath)) {
    log(`Migrations directory NOT FOUND at: ${migrationsPath}`);
    // Diagnostic listing of resources path
    if (!is.dev) {
        try {
            log(`Contents of resources path (${process.resourcesPath}):`);
            fs.readdirSync(process.resourcesPath).forEach(f => log(` - ${f}`));
            
            const prismaPath = join(process.resourcesPath, 'prisma');
            if (fs.existsSync(prismaPath)) {
                log(`Contents of prisma path (${prismaPath}):`);
                fs.readdirSync(prismaPath).forEach(f => log(` - ${f}`));
            }
        } catch (e) {
            log(`Failed to list directory contents: ${e}`);
        }
    }
    return;
  }

  // Get list of migration folders (sorted by name/timestamp)
  const migrationFolders = fs.readdirSync(migrationsPath)
    .filter(f => fs.statSync(join(migrationsPath, f)).isDirectory())
    .sort();
  
  log(`Found migration folders: ${migrationFolders.join(', ')}`);

  // Get applied migrations from DB
  let appliedMigrations: string[] = [];
  try {
    const records: any[] = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations`;
    appliedMigrations = records.map(r => r.migration_name);
    log(`Already applied migrations: ${appliedMigrations.join(', ')}`);
  } catch (e) {
    log(`Could not query _prisma_migrations, assuming empty DB or first run. Error: ${e}`);
  }

  // Apply new migrations
  for (const migrationName of migrationFolders) {
    if (!appliedMigrations.includes(migrationName)) {
      log(`Applying migration: ${migrationName}`);
      const migrationFile = join(migrationsPath, migrationName, 'migration.sql');
      
      if (fs.existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, 'utf-8');
        // Split by semicolon. Note: This is a simple split and might break on complex SQL 
        // (e.g. semicolons in strings), but standard Prisma migrations are usually clean.
        const statements = sql.split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
          
        try {
          for (const statement of statements) {
             await prisma.$executeRawUnsafe(statement);
          }
          
          // Mark as applied
          const id = crypto.randomUUID(); 
          const checksum = '0'; // Placeholder checksum
          
          await prisma.$executeRaw`
            INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (${id}, ${checksum}, CURRENT_TIMESTAMP, ${migrationName}, '', NULL, CURRENT_TIMESTAMP, ${statements.length})
          `;
          
          log(`Migration ${migrationName} applied successfully.`);
        } catch (e) {
          log(`FAILED to apply migration ${migrationName}: ${e}`);
          dialog.showErrorBox('Migration Error', `Failed to update database schema (Migration: ${migrationName}).\nPlease contact support.\nError: ${e}`);
          throw e; 
        }
      } else {
         log(`Migration file missing for ${migrationName} at ${migrationFile}`);
      }
    }
  }
}
// ------------------------

// Ensure default user exists
async function ensureUser() {
  log("Ensuring user exists...");
  try {
    const count = await prisma.user.count();
    log(`User count: ${count}`);
    if (count === 0) {
      await prisma.user.create({
        data: {
          name: "Local User",
          email: "local@trekker.app"
        }
      });
      log("Default user created.");
    }
  } catch (error) {
    log(`Error in ensureUser: ${error}`);
    throw error;
  }
}

function registerIpcHandlers() {
  log("Registering IPC handlers...");
  // NOTES
  ipcMain.handle('db:getNotes', async (_, filter?: { resourceType?: string, resourceDate?: Date, start?: Date, end?: Date }) => {
    const where: any = {};
    
    if (filter?.start && filter?.end) {
       where.resourceDate = {
         gte: filter.start,
         lte: filter.end
       };
    } else {
       if (filter?.resourceType) {
         where.resourceType = filter.resourceType;
       }
       if (filter?.resourceDate) {
         where.resourceDate = filter.resourceDate;
       }
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { resourceDate: 'asc' }
    });

    // Enrich with widget usage info
    const noteIds = notes.map(n => n.id);
    const widgets = await prisma.widget.findMany({
        where: { dataSourceId: { in: noteIds } },
        include: { container: true }
    });

    return notes.map(note => {
        const linkedWidgets = widgets.filter(w => w.dataSourceId === note.id);
        
        const usedIn = linkedWidgets.map(w => ({
            widgetId: w.id,
            containerType: w.container.type,
            containerTitle: w.container.title
        }));

        // Add Calendar link if applicable
        if (note.resourceDate || note.resourceType) {
            usedIn.push({
                widgetId: 'calendar-link',
                containerType: 'calendar',
                containerTitle: 'Calendar'
            });
        }

        return {
            ...note,
            usedIn
        };
    });
  });

  ipcMain.handle('db:createNote', async (_, { title, content, color, resourceType, resourceDate }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");
    
    return await prisma.note.create({
      data: {
        userId: user.id,
        title,
        content,
        color: color || '#fff9c4',
        resourceType: resourceType || null,
        resourceDate: resourceDate || null
      }
    });
  });

  ipcMain.handle('db:updateNote', async (_, { id, title, content, color }) => {
    return await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        color
      }
    });
  });

  ipcMain.handle('db:deleteNote', async (_, { id }) => {
    // Also delete associated widgets to keep canvas clean
    await prisma.widget.deleteMany({
      where: { dataSourceId: id }
    });

    return await prisma.note.delete({
      where: { id }
    });
  });

  // CANVAS / WIDGETS
  ipcMain.handle('db:createWidget', async (_, { type, position, settings, dataSourceId }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");

    // For now, let's assume we have a default "Canvas" container or create one on the fly
    let container = await prisma.container.findFirst({ where: { type: 'canvas' } });
    if (!container) {
      container = await prisma.container.create({
        data: {
          userId: user.id,
          title: "Main Canvas",
          type: "canvas"
        }
      });
    }

    return await prisma.widget.create({
      data: {
        userId: user.id,
        containerId: container.id,
        type,
        position: JSON.stringify(position),
        settings: JSON.stringify(settings || {}),
        dataSourceId
      }
    });
  });

  ipcMain.handle('db:getWidgets', async () => {
    // Get widgets for the main canvas
    const container = await prisma.container.findFirst({ where: { type: 'canvas' } });
    if (!container) return [];

    const widgets = await prisma.widget.findMany({
      where: { containerId: container.id }
    });

    // Enrich widgets with data from their data sources
    const enrichedWidgets = await Promise.all(widgets.map(async (widget) => {
      if (widget.type === 'note' && widget.dataSourceId) {
        const note = await prisma.note.findUnique({
          where: { id: widget.dataSourceId }
        });
        if (note) {
          return {
            ...widget,
            data: note // Attach the actual note data
          };
        }
      } else if (widget.type === 'event' && widget.dataSourceId) {
        const event = await prisma.event.findUnique({
          where: { id: widget.dataSourceId }
        });
        if (event) {
          return {
            ...widget,
            data: event // Attach the actual event data
          };
        }
      }
      return widget;
    }));

    return enrichedWidgets;
  });

  ipcMain.handle('db:deleteWidget', async (_, { id }) => {
    // Delete associated edges too
    await prisma.edge.deleteMany({
      where: {
        OR: [{ source: id }, { target: id }]
      }
    });

    return await prisma.widget.delete({
      where: { id }
    });
  });

  ipcMain.handle('db:updateWidgetPosition', async (_, { id, position }) => {
    return await prisma.widget.update({
      where: { id },
      data: { position: JSON.stringify(position) }
    });
  });

  ipcMain.handle('db:updateWidget', async (_, { id, dataSourceId, settings }) => {
    return await prisma.widget.update({
      where: { id },
      data: {
        dataSourceId,
        settings: settings ? JSON.stringify(settings) : undefined
      }
    });
  });

  // EDGES
  ipcMain.handle('db:getEdges', async () => {
    const container = await prisma.container.findFirst({ where: { type: 'canvas' } });
    if (!container) return [];
    return await prisma.edge.findMany({ where: { containerId: container.id } });
  });

  ipcMain.handle('db:createEdge', async (_, { source, target, sourceHandle, targetHandle }) => {
    const container = await prisma.container.findFirst({ where: { type: 'canvas' } });
    if (!container) throw new Error("No canvas container found");
    
    return await prisma.edge.create({
      data: {
        containerId: container.id,
        source,
        target,
        sourceHandle,
        targetHandle
      }
    });
  });

  ipcMain.handle('db:deleteEdge', async (_, { id }) => {
    return await prisma.edge.delete({ where: { id } });
  });

  // CONTAINER SETTINGS (for persisting Viewport)
  ipcMain.handle('db:getContainerSettings', async (_, { type }) => {
    const container = await prisma.container.findFirst({ where: { type } });
    if (!container) return null;
    return container.settings ? JSON.parse(container.settings) : null;
  });

  ipcMain.handle('db:updateContainerSettings', async (_, { type, settings }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");

    let container = await prisma.container.findFirst({ where: { type } });
    if (!container) {
      container = await prisma.container.create({
        data: {
          userId: user.id,
          title: `Main ${type}`,
          type,
          settings: JSON.stringify(settings)
        }
      });
    } else {
      await prisma.container.update({
        where: { id: container.id },
        data: { settings: JSON.stringify(settings) }
      });
    }
    return true;
  });

  // EVENTS (CALENDAR)
  ipcMain.handle('db:getEvents', async () => {
    return await prisma.event.findMany({
      orderBy: { start: 'asc' }
    });
  });

  ipcMain.handle('db:createEvent', async (_, { title, start, end, allDay, description, color }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");
    
    return await prisma.event.create({
      data: {
        userId: user.id,
        title,
        start,
        end,
        allDay: allDay || false,
        description,
        color: color || '#6366f1'
      }
    });
  });

  ipcMain.handle('db:updateEvent', async (_, { id, ...data }) => {
    return await prisma.event.update({
      where: { id },
      data
    });
  });

  ipcMain.handle('db:deleteEvent', async (_, { id }) => {
    try {
      // 1. Delete any widgets linked to this event
      await prisma.widget.deleteMany({
        where: { dataSourceId: id }
      });

      // 2. Delete the event itself
      return await prisma.event.delete({
        where: { id }
      });
    } catch (e: any) {
      // Ignore "Record not found" errors to prevent frontend crashes
      if (e.code === 'P2025') {
        return null;
      }
      throw e;
    }
  });

  // HABITS
  ipcMain.handle('db:getHabits', async () => {
    const habits = await prisma.habit.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const habitIds = habits.map(h => h.id);
    const widgets = await prisma.widget.findMany({
        where: { dataSourceId: { in: habitIds } },
        include: { container: true }
    });

    return habits.map(habit => {
        const linkedWidgets = widgets.filter(w => w.dataSourceId === habit.id);
        return {
            ...habit,
            usedIn: linkedWidgets.map(w => ({
                widgetId: w.id,
                containerType: w.container.type,
                containerTitle: w.container.title
            }))
        };
    });
  });

  ipcMain.handle('db:createHabit', async (_, { title, description, frequency }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");
    
    return await prisma.habit.create({
      data: {
        userId: user.id,
        title,
        description,
        frequency: frequency || 'daily',
        completedDates: '[]' // Initialize with empty array
      }
    });
  });

  ipcMain.handle('db:updateHabit', async (_, { id, ...data }) => {
    return await prisma.habit.update({
      where: { id },
      data
    });
  });

  ipcMain.handle('db:deleteHabit', async (_, { id }) => {
    // Also delete any widgets linked to this habit
    await prisma.widget.deleteMany({
      where: { dataSourceId: id }
    });

    return await prisma.habit.delete({
      where: { id }
    });
  });

  // RECENT ITEMS API
  ipcMain.handle('db:getRecentItems', async (_, { type, limit = 3 }) => {
    const l = limit || 3;
    switch (type) {
      case 'note':
        return await prisma.note.findMany({
          orderBy: { createdAt: 'desc' },
          take: l
        });
      case 'habit':
        return await prisma.habit.findMany({
          orderBy: { createdAt: 'desc' },
          take: l
        });
      case 'event':
        return await prisma.event.findMany({
          orderBy: { createdAt: 'desc' }, // Recently created events
          take: l
        });
      default:
        return [];
    }
  });

  log("IPC handlers registered.");
}

function createWindow(): void {
  log("Creating window...");
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  
  mainWindow.on('ready-to-show', () => {
    log("Window ready to show");
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite CLI.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  log("App ready event received");
  electronApp.setAppUserModelId('com.electron')

  try {
    await runMigrations();
    await ensureUser();
    registerIpcHandlers();

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()
  } catch (error: any) {
    log(`CRITICAL ERROR during startup: ${error.stack || error}`);
    dialog.showErrorBox('Startup Error', `An error occurred while starting the application:\n${error.message}`);
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
