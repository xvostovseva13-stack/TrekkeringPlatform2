import { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NoteNode from '../components/canvas/NoteNode';
import EventNode from '../components/canvas/EventNode';
import HabitNode from '../components/canvas/HabitNode';
import CanvasToolbar, { CanvasTool } from '../components/canvas/CanvasToolbar';
import dayjs from 'dayjs';
import { EventModal } from '../features/calendar/EventModal';
import { HabitModal } from '../features/habits/HabitModal';
import { NoteModal } from '../components/canvas/NoteModal';
import { emitTrekkerEvent, useTrekkerEvent } from '../utils/eventBus';

// Define custom node types
const nodeTypes = {
  note: NoteNode,
  event: EventNode,
  habit: HabitNode,
};

const CanvasInner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('cursor');
  const { setViewport, screenToFlowPosition } = useReactFlow();

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // Habit Modal State
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [targetWidgetId, setTargetWidgetId] = useState<string | null>(null);

  // Note Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const handleDeleteNode = useCallback(async (id: string) => {
    const electron = window.electron;
    if (electron && electron.db) {
      try {
        await electron.db.deleteWidget({ id });
        setNodes((nds) => nds.filter((node) => node.id !== id));
      } catch (error) {
        console.error("Failed to delete widget:", error);
      }
    }
  }, [setNodes]);

  const handleEditEventWidget = useCallback((widgetId: string) => {
    setNodes((currentNodes) => {
        const node = currentNodes.find(n => n.id === widgetId);
        if (node && node.data) {
            console.log("CANVAS: Editing event widget", node.data);
            const eventData = {
                id: node.data.dataSourceId,
                title: node.data.label,
                color: node.data.color,
                start: node.data.start,
                end: node.data.end,
                allDay: node.data.allDay
            };
            setEditingEvent(eventData);
            setShowEventModal(true);
        }
        return currentNodes;
    });
  }, [setNodes]);

  const handleEditHabitWidget = useCallback((habit: any | null, widgetId: string) => {
      console.log("CANVAS: Editing habit", habit, "for widget", widgetId);
      setEditingHabit(habit);
      setTargetWidgetId(widgetId);
      setShowHabitModal(true);
  }, []);

  const handleEditNoteWidget = useCallback((widgetId: string) => {
    setNodes((currentNodes) => {
        const node = currentNodes.find(n => n.id === widgetId);
        if (node && node.data) {
            console.log("CANVAS: Editing note widget", node.data);
            const noteData = {
                id: node.data.dataSourceId,
                title: node.data.label,
                content: node.data.content,
                color: node.data.color,
            };
            setEditingNote(noteData);
            setShowNoteModal(true);
        }
        return currentNodes;
    });
  }, [setNodes]);

  const loadCanvasData = useCallback(async () => {
    const electron = window.electron;
    if (electron && electron.db) {
      try {
        // Load Viewport
        const settings = await electron.db.getContainerSettings({ type: 'canvas' });
        if (settings && settings.viewport) {
          setTimeout(() => {
            setViewport(settings.viewport, { duration: 0 });
          }, 50);
        }

        // Load Widgets
        const widgets = await electron.db.getWidgets();
        
        const flowNodes: Node[] = widgets.map((w: any) => {
          const position = JSON.parse(w.position);
          const settings = JSON.parse(w.settings || '{}');
          
          let data: any = {
             id: w.id, // Widget ID
             label: w.data?.title || settings.title || 'Untitled',
             onDelete: handleDeleteNode,
             dataSourceId: w.dataSourceId,
             // Common edit handler might be overwritten below
          };

          if (w.type === 'note') {
             data = { 
               ...data, 
               content: w.data?.content || '', 
               color: w.data?.color || '#fff9c4',
               onEdit: handleEditNoteWidget 
             };
          } else if (w.type === 'event') {
             data = { 
                ...data, 
                color: w.data?.color || '#6366f1',
                start: w.data?.start,
                end: w.data?.end,
                allDay: w.data?.allDay,
                onEdit: handleEditEventWidget
             };
          } else if (w.type === 'habit') {
              data = {
                  ...data,
                  onEdit: handleEditHabitWidget // Specific handler for habits
              };
          }
          
          return {
            id: w.id,
            type: w.type, 
            position: position,
            data
          };
        });

        // Load Edges
        const dbEdges = await electron.db.getEdges();
        const flowEdges = dbEdges.map((e: any) => {
           const mapHandle = (h: string | null) => {
             if (h === 'top') return 't-t';
             if (h === 'bottom') return 'b-s';
             if (h === 'left') return 'l-t';
             if (h === 'right') return 'r-s';
             return h;
           };

           return {
             id: e.id,
             source: e.source,
             target: e.target,
             sourceHandle: mapHandle(e.sourceHandle),
             targetHandle: mapHandle(e.targetHandle),
           };
         });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (e) {
        console.error("Failed to load canvas data", e);
      }
    }
  }, [setNodes, setEdges, setViewport, handleDeleteNode, handleEditEventWidget, handleEditHabitWidget, handleEditNoteWidget]);

  // Subscribe to Event Bus
  useTrekkerEvent('EVENT_CHANGED', () => {
    console.log("CANVAS: Received EVENT_CHANGED, reloading data...");
    loadCanvasData();
  });
  
  useTrekkerEvent('HABIT_CHANGED', () => {
      console.log("CANVAS: Received HABIT_CHANGED, reloading data...");
      loadCanvasData();
  });

  useTrekkerEvent('NOTE_CHANGED', () => {
    console.log("CANVAS: Received NOTE_CHANGED, reloading data...");
    loadCanvasData();
  });

  const handleSaveEvent = async (data: any) => {
    if (!window.electron) return;
    try {
        console.log("CANVAS: Saving event data", data);
        await window.electron.db.updateEvent(data);
        emitTrekkerEvent('EVENT_CHANGED'); // Notify others (and self via listener)
        setShowEventModal(false);
    } catch (e) {
        console.error("CANVAS: Failed to save event", e);
    }
  };
  
  const handleDeleteEvent = async (id: string) => {
      if (window.electron) {
          console.log("CANVAS: Deleting event", id);
          await window.electron.db.deleteEvent({ id });
          emitTrekkerEvent('EVENT_CHANGED'); // Notify others
      }
      setShowEventModal(false);
  };

  const handleSaveHabit = async (habitData: any) => {
      if (!window.electron) return;
      try {
          let habitId = habitData.id;
          if (habitId) {
              // Update
              await window.electron.db.updateHabit({
                  id: habitData.id,
                  title: habitData.title,
                  description: habitData.description,
                  frequency: habitData.frequency
              });
          } else {
              // Create
              const newHabit = await window.electron.db.createHabit({
                  title: habitData.title,
                  description: habitData.description,
                  frequency: habitData.frequency || 'daily'
              });
              habitId = newHabit.id;
          }

          // If this was triggered by "Create New" on a widget, link it
          if (targetWidgetId && !habitData.id) { // Only link if it was a NEW creation
               await window.electron.db.updateWidget({
                   id: targetWidgetId,
                   dataSourceId: habitId,
                   settings: { title: 'Habit Tracker' }
               });
          }

          emitTrekkerEvent('HABIT_CHANGED');
          setShowHabitModal(false);
          setEditingHabit(null);
          setTargetWidgetId(null);
      } catch (e) {
          console.error("Failed to save habit", e);
      }
  };
  
  const handleDeleteHabit = async (id: string) => {
      if (window.electron) {
          await window.electron.db.deleteHabit({ id });
          emitTrekkerEvent('HABIT_CHANGED');
      }
      setShowHabitModal(false);
  };

  const handleSaveNote = async (data: any) => {
    if (!window.electron) return;
    try {
        console.log("CANVAS: Saving note data", data);
        await window.electron.db.updateNote(data);
        emitTrekkerEvent('NOTE_CHANGED'); 
        setShowNoteModal(false);
    } catch (e) {
        console.error("CANVAS: Failed to save note", e);
    }
  };

  const handleDeleteNoteFromModal = async (id: string) => {
    if (window.electron) {
        console.log("CANVAS: Deleting note", id);
        // Note: We might want to just delete the widget or the note itself.
        // Usually, deleting the note via modal implies deleting the data.
        await window.electron.db.deleteNote({ id });
        emitTrekkerEvent('NOTE_CHANGED'); 
    }
    setShowNoteModal(false);
  };

  // Load on mount
  useEffect(() => {
    loadCanvasData();
  }, [loadCanvasData]);

  // Listen for Drop Events (DnD)
  useEffect(() => {
    const handleDrop = async (e: CustomEvent) => {
      const { type, data, finalPosition } = e.detail;
      const electron = window.electron;
      if (!electron) return;

      // Convert screen coordinates to Flow coordinates
      const position = screenToFlowPosition({ 
        x: finalPosition.x, 
        y: finalPosition.y 
      });

      const isHistory = data.source === 'history';
      const originalId = data.originalId;

      if (type === 'note') {
         let dataSourceId = originalId;

         if (!isHistory) {
             // Create New Note
             const newNote = await electron.db.createNote({
                title: 'New Note',
                content: '',
                color: data.color || '#fff9c4'
             });
             dataSourceId = newNote.id;
         }

         // Create Widget
         await electron.db.createWidget({
            type: 'note',
            position: position,
            dataSourceId: dataSourceId,
            settings: { title: data.title || 'New Note' }
         });
         emitTrekkerEvent('NOTE_CHANGED');

      } else if (type === 'event') {
         let dataSourceId = originalId;
         
         if (!isHistory) {
             // Create New Event (Default to today)
             const start = dayjs().hour(12).minute(0).toDate();
             const end = dayjs().hour(13).minute(0).toDate();
             
             const newEvent = await electron.db.createEvent({
                title: 'New Event',
                start,
                end,
                allDay: false,
                color: data.color || '#6366f1'
             });
             dataSourceId = newEvent.id;
         }

         // Create Widget
         await electron.db.createWidget({
            type: 'event',
            position: position,
            dataSourceId: dataSourceId,
            settings: { title: data.title || 'New Event' }
         });
         
         emitTrekkerEvent('EVENT_CHANGED');

      } else if (type === 'habit') {
          // Create Widget
          // If history, we have originalId to link immediately
          // If new, we create unlinked widget and open modal
          
          const newWidget = await electron.db.createWidget({
              type: 'habit',
              position: position,
              dataSourceId: isHistory ? originalId : undefined,
              settings: { title: data.title || 'Habit Tracker' }
          });
          
          // Reload to show the widget
          await loadCanvasData();
          
          // Only open modal if it's a NEW creation (not from history)
          if (!isHistory) {
              handleEditHabitWidget(null, newWidget.id);
          }
      }
    };

    window.addEventListener('widget-drop', handleDrop as unknown as EventListener);
    return () => window.removeEventListener('widget-drop', handleDrop as unknown as EventListener);
  }, [screenToFlowPosition, loadCanvasData]);

  const onConnect = useCallback(
    async (params: Connection) => {
      const electron = window.electron;
      if (electron && electron.db) {
        try {
          const newEdge = await electron.db.createEdge({
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle ?? undefined,
            targetHandle: params.targetHandle ?? undefined
          });
          
          setEdges((eds) => addEdge({ ...params, id: newEdge.id }, eds));
        } catch (e) {
          console.error("Failed to save edge", e);
          setEdges((eds) => addEdge(params, eds));
        }
      }
    },
    [setEdges],
  );

  const onEdgesDelete = useCallback(
    async (edgesToDelete: any[]) => {
      const electron = window.electron;
      if (electron && electron.db) {
        for (const edge of edgesToDelete) {
          try {
            await electron.db.deleteEdge({ id: edge.id });
          } catch (e) {
            console.error("Failed to delete edge from DB", e);
          }
        }
      }
    },
    []
  );

  const onEdgeDoubleClick = useCallback(
    async (_: React.MouseEvent, edge: Edge) => {
      const electron = window.electron;
      if (electron && electron.db) {
        try {
          await electron.db.deleteEdge({ id: edge.id });
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        } catch (e) {
          console.error("CANVAS: Failed to delete edge via double-click", e);
        }
      }
    },
    [setEdges]
  );

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodes((ns) => {
        const targetNode = ns.find(n => n.id === node.id);
        if (!targetNode) return ns;
        const others = ns.filter((n) => n.id !== node.id);
        return [...others, targetNode];
      });
    },
    [setNodes]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const electron = window.electron;
      if (electron && electron.db) {
        electron.db.updateWidgetPosition(node.id, node.position);
      }
    },
    []
  );

  const onMoveEnd = useCallback((_: any, viewport: any) => {
    const electron = window.electron;
    if (electron && electron.db) {
      electron.db.updateContainerSettings({ 
        type: 'canvas', 
        settings: { viewport } 
      });
    }
  }, []);

  return (
    <div className="h-100 bg-light rounded-3 shadow-sm border overflow-hidden position-relative">
      <CanvasToolbar activeTool={activeTool} onToolChange={setActiveTool} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={[10, 10]}
        panOnDrag={activeTool === 'hand' ? [0, 1] : [1]}
        selectionOnDrag={activeTool === 'cursor'}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={4}
        nodesDraggable={activeTool === 'cursor'}
        nodesConnectable={activeTool === 'cursor'}
        elementsSelectable={activeTool === 'cursor'}
      >
        <Background 
          bgColor="#eef2ff" 
          color="#000000" 
          variant={BackgroundVariant.Dots} 
          gap={20}
          size={1}
        />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Unified Event Modal */}
      <EventModal 
        show={showEventModal}
        onHide={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={editingEvent}
      />

      {/* Unified Habit Modal */}
      <HabitModal
        show={showHabitModal}
        onHide={() => setShowHabitModal(false)}
        onSave={handleSaveHabit}
        onDelete={handleDeleteHabit}
        habit={editingHabit}
      />

      {/* Unified Note Modal */}
      <NoteModal
        show={showNoteModal}
        onHide={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNoteFromModal}
        note={editingNote}
      />
    </div>
  );
};

const CanvasPage = () => (
  <ReactFlowProvider>
    <CanvasInner />
  </ReactFlowProvider>
);

export default CanvasPage;
