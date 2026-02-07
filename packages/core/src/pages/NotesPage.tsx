import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, CloseButton } from 'react-bootstrap';
import { HiOutlineTrash, HiOutlineMapPin } from 'react-icons/hi2';
import { useToolbarActions } from '../context/ToolbarActionContext';
import { handleNoteKeyDown } from '../utils/editorUtils';

const COLORS = [
  '#fff9c4', // Yellow
  '#d1e7dd', // Green
  '#cff4fc', // Blue
  '#f8d7da', // Red/Pink
  '#e2e3e5', // Grey
  '#fff3cd', // Orange
];

const NotesPage = () => {
  const { setNoteAction } = useToolbarActions();
  const [notes, setNotes] = useState<any[]>([]);
  
  // Editor State
  const [expandedId, setExpandedId] = useState<string | null>(null); // If null but isCreating=true, it's a new note
  const [isCreating, setIsCreating] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);

  // Load notes
  const loadNotes = async () => {
    if (window.electron && window.electron.db) {
      try {
        const data = await window.electron.db.getNotes(); // Get ALL notes
        setNotes(data);
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Register Global Toolbar Action
  useEffect(() => {
    setNoteAction(() => () => {
      setIsCreating(true);
      setExpandedId(null);
      setEditTitle('');
      setEditContent('');
      setEditColor(COLORS[0]);
    });
    return () => setNoteAction(null);
  }, [setNoteAction]);

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
    if (!window.electron) return;

    if (expandedId) {
      // Update
      await window.electron.db.updateNote({
        id: expandedId,
        title: editTitle,
        content: editContent,
        color: editColor
      });
    } else {
      // Create
      await window.electron.db.createNote({
        title: editTitle,
        content: editContent,
        color: editColor
      });
    }
    
    closeEditor();
    loadNotes();
  };

  const handleDelete = async () => {
    if (!expandedId || !window.electron) return;
    if (confirm('Delete this note?')) {
      await window.electron.db.deleteNote({ id: expandedId });
      closeEditor();
      loadNotes();
    }
  };

  const handlePinToCanvas = async () => {
    if (!expandedId || !window.electron) return;
    const note = notes.find(n => n.id === expandedId);
    if (!note) return;

    try {
      await window.electron.db.createWidget({
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
    <div className="h-100 position-relative d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Notes</h2>
      </div>

      <div className="flex-grow-1 overflow-auto pb-4">
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
                    {note.resourceType && (
                        <div className="mt-2 text-end">
                            <span className="badge bg-dark bg-opacity-10 text-dark small">
                                {note.resourceType}
                            </span>
                        </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {notes.length === 0 && (
                <div className="text-center text-muted mt-5">
                    No notes found. Create one using the toolbar!
                </div>
            )}
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
