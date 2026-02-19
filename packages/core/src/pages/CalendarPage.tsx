import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import { View, SlotInfo } from 'react-big-calendar';

import BigCalendar from '../features/calendar/BigCalendar';
import CalendarToolbar from '../features/calendar/CalendarToolbar';
import ContextNotesPanel from '../features/calendar/ContextNotesPanel';
import YearView from '../features/calendar/YearView';
import DayView from '../features/calendar/DayView';
import { EventModal } from '../features/calendar/EventModal';
import { emitTrekkerEvent, useTrekkerEvent } from '../utils/eventBus';

type ViewType = 'year' | 'month' | 'day';

const COLORS = [
  '#fff9c4', '#d1e7dd', '#cff4fc', '#f8d7da', '#e2e3e5', '#fff3cd',
];

const CalendarPage = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  
  // Note Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState(COLORS[0]);

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [initialEventDate, setInitialEventDate] = useState<Date | undefined>(undefined);

  // --- Data Loading ---

  const fetchEvents = useCallback(async () => {
    if (!window.electron) return;
    try {
      const rawEvents = await window.electron.db.getEvents();
      // Convert to Date objects
      const formatted = rawEvents.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      }));
      setEvents(formatted);
    } catch (e) {
      console.error("Failed to load events", e);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!window.electron) return;
    
    // Always fetch notes for the whole year to display in the categorized panel
    const startOfYear = dayjs(date).startOf('year').toDate();
    const endOfYear = dayjs(date).endOf('year').toDate();
    
    try {
      const data = await window.electron.db.getNotes({
        start: startOfYear,
        end: endOfYear
      });
      setNotes(data);
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  }, [date]);

  useEffect(() => {
    fetchEvents();
    fetchNotes();
  }, [fetchEvents, fetchNotes]);

  // --- Event Bus Subscriptions ---
  useTrekkerEvent('EVENT_CHANGED', () => {
    console.log("CALENDAR: Received EVENT_CHANGED, reloading...");
    fetchEvents();
  });

  useTrekkerEvent('NOTE_CHANGED', () => {
    console.log("CALENDAR: Received NOTE_CHANGED, reloading...");
    fetchNotes();
  });

  // --- Handlers ---

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = dayjs(date);
    if (action === 'TODAY') {
      newDate = dayjs();
    } else {
      const method = action === 'NEXT' ? 'add' : 'subtract';
      const unit = view === 'year' ? 'year' : view === 'month' ? 'month' : 'day';
      newDate = newDate[method](1, unit);
    }
    setDate(newDate.toDate());
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
  };

  // Create Context Note
  const handleCreateNote = async () => {
    if (!newNoteTitle || !window.electron) return;
    
    const resourceDate = dayjs(date).startOf(view === 'year' ? 'year' : view === 'month' ? 'month' : 'day').toDate();
    
    try {
      await window.electron.db.createNote({
        title: newNoteTitle,
        content: newNoteContent,
        color: newNoteColor,
        resourceType: view,
        resourceDate: resourceDate
      });
      emitTrekkerEvent('NOTE_CHANGED');
      setShowNoteModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      // fetchNotes(); // Handled by event bus
    } catch (e) {
      console.error(e);
      alert('Failed to create note');
    }
  };

  const handleUpdateNote = async (note: any) => {
    if (!window.electron) return;
    await window.electron.db.updateNote(note);
    emitTrekkerEvent('NOTE_CHANGED');
    // fetchNotes(); // Handled by event bus
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.electron) return;
    await window.electron.db.deleteNote({ id });
    emitTrekkerEvent('NOTE_CHANGED');
    // fetchNotes(); // Handled by event bus
  };

  // Calendar Event Logic
  
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (view === 'month') {
        // Navigate to Day View on click
        setDate(slotInfo.start);
        setView('day');
    } else {
        // Open Modal for New Event (Week/Day big calendar view)
        setEditingEvent(null);
        setInitialEventDate(slotInfo.start);
        setShowEventModal(true);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (data: any) => {
    if (!window.electron) return;

    try {
        if (data.id) {
            await window.electron.db.updateEvent(data);
        } else {
            await window.electron.db.createEvent(data);
        }
        emitTrekkerEvent('EVENT_CHANGED');
        setShowEventModal(false);
        // fetchEvents(); // Handled by event bus
    } catch (e) {
        console.error(e);
        alert('Failed to save event');
    }
  };
  
  // Helper for DayView add button
  const handleAddEventFromDayView = (start: Date) => {
    setEditingEvent(null);
    setInitialEventDate(start);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.electron) return;
    try {
        await window.electron.db.deleteEvent({ id });
        emitTrekkerEvent('EVENT_CHANGED');
        // fetchEvents(); // Handled by event bus
    } catch (e) {
        console.error("Failed to delete event", e);
    }
  };

  // DnD Listener
  useEffect(() => {
    const handleDrop = async (e: CustomEvent) => {
      const { type, data } = e.detail;
      const electron = window.electron;
      if (!electron) return;

      if (type === 'event') {
        console.log("CALENDAR: Event dropped!");
        // Default to current time or start of day depending on view
        const start = view === 'day' ? dayjs(date).hour(12).minute(0).toDate() : dayjs(date).startOf('day').toDate();
        
        handleAddEventFromDayView(start);
      } else if (type === 'note') {
        console.log("CALENDAR: Note dropped!");
        // Create a note linked to the current view context
        // If in Month view -> link to that month? Or day?
        // Let's assume drop means "add to current view context".
        // If view is Day -> add to Day. If Month -> add to Month.
        
        const resourceDate = dayjs(date).startOf(view === 'year' ? 'year' : view === 'month' ? 'month' : 'day').toDate();
        
        try {
            await electron.db.createNote({
                title: 'New Note',
                content: '',
                color: data.color || '#fff9c4',
                resourceType: view,
                resourceDate: resourceDate
            });
            emitTrekkerEvent('NOTE_CHANGED');
            // fetchNotes(); // Handled by event bus
        } catch (err) {
            console.error("Failed to create dropped note", err);
        }
      }
    };

    window.addEventListener('widget-drop', handleDrop as unknown as EventListener);
    return () => window.removeEventListener('widget-drop', handleDrop as unknown as EventListener);
  }, [date, view, fetchNotes]); // Added fetchNotes to deps

  return (
    <div className="h-100 d-flex flex-column bg-white">
      {/* Toolbar (Internal to Calendar) */}
      <CalendarToolbar 
        date={date}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={handleViewChange}
      />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Context Notes Panel */}
        <ContextNotesPanel 
            notes={notes}
            title={`Notes for ${dayjs(date).format('YYYY')}`}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
        />

        {/* Calendar View */}
        <div className="flex-grow-1 p-3 bg-light overflow-hidden">
           {view === 'year' ? (
             <div className="h-100 overflow-auto">
                <YearView 
                    date={date} 
                    events={events} 
                    onMonthClick={(d) => {
                        setDate(d);
                        setView('month');
                    }}
                />
             </div>
           ) : view === 'day' ? (
             <DayView 
                date={date}
                events={events}
                onAddEvent={handleAddEventFromDayView}
                onEditEvent={handleEditEvent}
             />
           ) : (
             <BigCalendar 
                date={date}
                view={view as View} 
                events={events}
                onNavigate={(d) => setDate(d)}
                onView={(v) => setView(v as ViewType)}
                onSelectSlot={handleSelectSlot}
             />
           )}
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fs-5 text-muted">New Context Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <div className="d-flex gap-2 mb-3">
                    {COLORS.map(c => (
                        <div 
                            key={c}
                            onClick={() => setNewNoteColor(c)}
                            style={{ 
                                width: 24, height: 24, 
                                backgroundColor: c, 
                                borderRadius: '50%', 
                                cursor: 'pointer',
                                border: newNoteColor === c ? '2px solid #6366f1' : '1px solid #dee2e6'
                            }}
                        />
                    ))}
                </div>
                <Form.Group className="mb-3">
                    <Form.Control 
                        placeholder="Title"
                        autoFocus
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        className="fw-bold"
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Control 
                        as="textarea" 
                        placeholder="Description..."
                        rows={5}
                        style={{ resize: 'none' }}
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                    />
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateNote} disabled={!newNoteTitle}>Save Note</Button>
        </Modal.Footer>
      </Modal>

      {/* Unified Event Modal */}
      <EventModal 
        show={showEventModal}
        onHide={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={editingEvent}
        initialDate={initialEventDate}
      />
    </div>
  );
};

export default CalendarPage;