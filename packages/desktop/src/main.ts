import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';

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
  ipcMain.handle('db:getNotes', async (_, filter?: { resourceType?: string, resourceDate?: Date }) => {
    const where: any = {};
    if (filter?.resourceType) {
      where.resourceType = filter.resourceType;
    }
    if (filter?.resourceDate) {
      where.resourceDate = filter.resourceDate;
    }

    return await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
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
      }
      return widget;
    }));

    return enrichedWidgets;
  });

  ipcMain.handle('db:deleteWidget', async (_, { id }) => {
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

  // EVENTS (CALENDAR)
  ipcMain.handle('db:getEvents', async () => {
    return await prisma.event.findMany({
      orderBy: { start: 'asc' }
    });
  });

  ipcMain.handle('db:createEvent', async (_, { title, start, end, allDay, description }) => {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");
    
    return await prisma.event.create({
      data: {
        userId: user.id,
        title,
        start,
        end,
        allDay: allDay || false,
        description
      }
    });
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
    // TEMPORARY: Open DevTools to debug white screen
    mainWindow.webContents.openDevTools();
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
