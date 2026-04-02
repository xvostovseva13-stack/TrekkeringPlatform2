import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, CloseButton, Badge } from 'react-bootstrap';
import { HiOutlineTrash, HiOutlineMapPin, HiOutlineMap, HiOutlinePlus } from 'react-icons/hi2';
import { handleNoteKeyDown } from '../utils/editorUtils';
import { useApi } from '../context/ApiContext';
import { emitTrekkerEvent } from '../utils/eventBus';

const COLORS = [
  '#fff9c4', // Yellow
  '#d1e7dd', // Green
  '#cff4fc', // Blue
  '#f8d7da', // Red/Pink
  '#e2e3e5', // Grey
  '#fff3cd', // Orange
];

const NotesPage = () => {
  const api = useApi();
  const [notes, setNotes] = useState<any[]>([]);
  
  // Editor State
  const [expandedId, setExpandedId] = useState<string | null>(null); // If null but isCreating=true, it's a new note
  const [isCreating, setIsCreating] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);

  // Load notes
  const loadNotes = useCallback(async () => {
    try {
      const data = await api.notes.getAll(); // Get ALL notes
      setNotes(data);
    } catch (e) {
      console.error("Failed to load notes", e);
    }
  }, [api]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNew = useCallback((color?: string) => {
    setExpandedId(null);
    setEditTitle('');
    setEditContent('');
    setEditColor(color || COLORS[0]);
    setIsCreating(true);
  }, []);

  // Listen for Drop Events (DnD)
  useEffect(() => {
    const handleDrop = async (e: CustomEvent) => {
      const { type, data } = e.detail;
      
      if (type === 'note') {
        handleCreateNew(data.color);
      }
    };

    window.addEventListener('widget-drop', handleDrop as unknown as EventListener);
    return () => window.removeEventListener('widget-drop', handleDrop as unknown as EventListener);
  }, [handleCreateNew]);

  // Sync state when expanding a note
  useEffect(() => {
    if (expandedId) {
      const note = notes.find(n => n.id === expandedId);
      if (note) {
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setEditColor(note.color || COLORS[0]);
        setIsCreating(false);
      }
    }
  }, [expandedId, notes]);

  const handleSave = async () => {
    if (!editTitle) return;

    if (expandedId) {
      // Update
      await api.notes.update({
        id: expandedId,
        title: editTitle,
        content: editContent,
        color: editColor
      });
    } else {
      // Create
      await api.notes.create({
        title: editTitle,
        content: editContent,
        color: editColor
      });
    }
    
    emitTrekkerEvent('NOTE_CHANGED');
    closeEditor();
    loadNotes();
  };

  const handleDelete = async () => {
    if (!expandedId) return;
    if (confirm('Delete this note?')) {
      await api.notes.delete({ id: expandedId });
      emitTrekkerEvent('NOTE_CHANGED');
      closeEditor();
      loadNotes();
    }
  };

  const handlePinToCanvas = async () => {
    if (!expandedId) return;
    const note = notes.find(n => n.id === expandedId);
    if (!note) return;

    try {
      await api.widgets.create({
        type: 'note',
        position: { x: 100, y: 100 },
        settings: { title: note.title },
        dataSourceId: note.id
      });
      alert(`Note pinned to Canvas!`);
    } catch (e) {
      console.error(e);
      alert("Failed to pin");
    }
  };

  const closeEditor = () => {
    setExpandedId(null);
    setIsCreating(false);
  };

  const isEditorOpen = expandedId || isCreating;

  return (
    <div className="h-100 position-relative d-flex flex-column bg-light overflow-hidden">
      {/* Page Header (Matching HabitsPage style) */}
      <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
        <h4 className="m-0 fw-bold">Notes</h4>
        <Button variant="primary" size="sm" onClick={() => handleCreateNew()}>
            <HiOutlinePlus className="me-1" /> New Note
        </Button>
      </div>

      <div className="flex-grow-1 overflow-y-auto overflow-x-hidden p-4">
        <Row className="g-3 m-0 justify-content-center">
          <Col xs={12} lg={11} xl={10}>
            <Row className="g-3">
                {notes.map(note => (
                  <Col key={note.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                    <Card 
                      className="h-100 border-0 shadow-sm cursor-pointer hover-shadow transition-all"
                      style={{ backgroundColor: note.color || '#fff9c4', minHeight: '150px', cursor: 'pointer' }}
                      onClick={() => setExpandedId(note.id)}
                    >
                      <Card.Body className="d-flex flex-column">
                        <h6 className="fw-bold mb-2 text-truncate">{note.title}</h6>
                        <div 
                            className="text-muted small flex-grow-1" 
                            style={{ 
                               display: '-webkit-box', 
                               WebkitLineClamp: 5, 
                               WebkitBoxOrient: 'vertical', 
                               overflow: 'hidden' 
                            }}
                        >
                          {note.content}
                        </div>
                        
                        {/* Usage Indicators */}
                        {note.usedIn && note.usedIn.length > 0 && (
                            <div className="d-flex align-items-center gap-1 mt-2 pt-2 border-top border-black border-opacity-10 flex-wrap">
                                {note.usedIn.map((usage: any, idx: number) => (
                                    <Badge 
                                        key={idx} 
                                        bg="light" 
                                        text="dark"
                                        className="fw-normal d-flex align-items-center gap-1 border border-secondary border-opacity-25"
                                        style={{ fontSize: '0.6rem' }}
                                    >
                                        {usage.containerType === 'canvas' && <HiOutlineMap size={10} />}
                                        {usage.containerType === 'canvas' ? 'Canvas' : usage.containerType}
                                    </Badge>
                                ))}
                            </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
            </Row>
            {notes.length === 0 && (
                <div className="text-center text-muted mt-5">
                    No notes found. Create one using the toolbar!
                </div>
            )}
          </Col>
        </Row>
      </div>

      {/* Editor Overlay */}
      {isEditorOpen && (
        <div 
            className="position-absolute top-0 start-0 w-100 h-100 bg-white d-flex flex-column shadow-lg rounded-3 overflow-hidden" 
            style={{ zIndex: 1050 }}
        >
          <div 
            className="p-3 d-flex justify-content-between align-items-center border-bottom"
            style={{ backgroundColor: editColor, transition: 'background-color 0.3s' }}
          >
            <div className="d-flex gap-2">
                {COLORS.map(c => (
                    <div 
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{ 
                            width: 24, height: 24, 
                            backgroundColor: c, 
                            borderRadius: '50%', 
                            cursor: 'pointer',
                            border: editColor === c ? '2px solid black' : '1px solid #00000020'
                        }}
                    />
                ))}
            </div>
            <CloseButton onClick={closeEditor} />
          </div>
          
          <div className="p-4 flex-grow-1 d-flex flex-column" style={{ backgroundColor: editColor }}>
            <Form.Control 
                type="text" 
                className="bg-transparent border-0 fw-bold display-6 mb-3 p-0 shadow-none"
                placeholder="Title"
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
            />
            <Form.Control 
                as="textarea" 
                className="bg-transparent border-0 flex-grow-1 p-0 shadow-none fs-5"
                style={{ resize: 'none' }}
                placeholder="Start typing..."
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleNoteKeyDown(e, editContent, setEditContent)}
            />
          </div>
          
          <div className="p-3 border-top bg-light d-flex justify-content-between align-items-center">
            <div>
                {expandedId && (
                    <Button variant="outline-danger" className="me-2" onClick={handleDelete}>
                        <HiOutlineTrash className="me-2"/> Delete
                    </Button>
                )}
                 {expandedId && (
                    <Button variant="outline-primary" onClick={handlePinToCanvas}>
                        <HiOutlineMapPin className="me-2"/> Pin to Canvas
                    </Button>
                )}
            </div>
            <Button variant="dark" size="lg" onClick={handleSave} disabled={!editTitle}>
                {expandedId ? 'Save Changes' : 'Create Note'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
