import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import { View, SlotInfo } from 'react-big-calendar';

import BigCalendar from '../features/calendar/BigCalendar';
import CalendarToolbar from '../features/calendar/CalendarToolbar';
import ContextNotesPanel from '../features/calendar/ContextNotesPanel';
import YearView from '../features/calendar/YearView';
import { useToolbarActions } from '../context/ToolbarActionContext';

type ViewType = 'year' | 'month';

const COLORS = [
  '#fff9c4', '#d1e7dd', '#cff4fc', '#f8d7da', '#e2e3e5', '#fff3cd',
];

const CalendarPage = () => {
  const { setNoteAction } = useToolbarActions();
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
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventSlot, setNewEventSlot] = useState<SlotInfo | null>(null);

  // Register Global Toolbar Action
  useEffect(() => {
    setNoteAction(() => () => setShowNoteModal(true));
    return () => setNoteAction(null);
  }, [setNoteAction]);

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
    
    // Calculate resourceDate based on current View + Date
    // e.g., if view='month', resourceDate = start of that month
    const resourceDate = dayjs(date).startOf(view === 'year' ? 'year' : view).toDate();
    
    try {
      const data = await window.electron.db.getNotes({
        resourceType: view,
        resourceDate: resourceDate
      });
      setNotes(data);
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  }, [date, view]);

  useEffect(() => {
    fetchEvents();
    fetchNotes();
  }, [fetchEvents, fetchNotes]);

  // --- Handlers ---

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = dayjs(date);
    if (action === 'TODAY') {
      newDate = dayjs();
    } else {
      const method = action === 'NEXT' ? 'add' : 'subtract';
      // Navigate by the current unit
      newDate = newDate[method](1, view === 'year' ? 'year' : view);
    }
    setDate(newDate.toDate());
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
  };

  // Create Context Note
  const handleCreateNote = async () => {
    if (!newNoteTitle || !window.electron) return;
    
    const resourceDate = dayjs(date).startOf(view === 'year' ? 'year' : view).toDate();
    
    try {
      await window.electron.db.createNote({
        title: newNoteTitle,
        content: newNoteContent,
        color: newNoteColor,
        resourceType: view,
        resourceDate: resourceDate
      });
      setShowNoteModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      fetchNotes();
    } catch (e) {
      console.error(e);
      alert('Failed to create note');
    }
  };

  const handleUpdateNote = async (note: any) => {
    if (!window.electron) return;
    await window.electron.db.updateNote(note);
    fetchNotes();
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.electron) return;
    await window.electron.db.deleteNote({ id });
    fetchNotes();
  };

  // Create Calendar Event
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setNewEventSlot(slotInfo);
    setNewEventTitle('');
    setShowEventModal(true);
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle || !newEventSlot || !window.electron) return;

    try {
        await window.electron.db.createEvent({
            title: newEventTitle,
            start: newEventSlot.start,
            end: newEventSlot.end,
            allDay: newEventSlot.action === 'doubleClick' || newEventSlot.slots.length === 1
        });
        setShowEventModal(false);
        fetchEvents();
    } catch (e) {
        console.error(e);
        alert('Failed to create event');
    }
  };

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
            title={`Notes for ${view === 'year' ? dayjs(date).format('YYYY') : dayjs(date).format('MMMM')}`}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
        />

        {/* Calendar View */}
        <div className="flex-grow-1 p-3 overflow-auto bg-light">
           {view === 'year' ? (
             <YearView 
                date={date} 
                events={events} // We can pass events to show dots
                onMonthClick={(d) => {
                    setDate(d);
                    setView('month');
                }}
             />
           ) : (
             <BigCalendar 
                date={date}
                view={view as View} // Cast safely as we filtered out 'year'
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

      {/* Add Event Modal */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fs-5 text-muted">New Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form onSubmit={(e) => { e.preventDefault(); handleCreateEvent(); }}>
                <Form.Group>
                    <Form.Control 
                        placeholder="Event Title"
                        autoFocus
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                        className="fw-bold"
                    />
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateEvent} disabled={!newEventTitle}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarPage;
