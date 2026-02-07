import { useState, useEffect } from 'react';
import { Card, Button, Form, CloseButton } from 'react-bootstrap';
import { HiOutlineTrash, HiOutlineMapPin } from 'react-icons/hi2';
import { handleNoteKeyDown } from '../../utils/editorUtils';

const COLORS = [
  '#fff9c4', // Yellow
  '#d1e7dd', // Green
  '#cff4fc', // Blue
  '#f8d7da', // Red/Pink
  '#e2e3e5', // Grey
  '#fff3cd', // Orange
];

interface ContextNotesPanelProps {
  notes: any[];
  onUpdateNote: (note: any) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  title: string; // "Notes for January", etc.
}

const ContextNotesPanel = ({ notes, onUpdateNote, onDeleteNote, title }: ContextNotesPanelProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);

  // Sync editor with expanded note
  useEffect(() => {
    if (expandedId) {
      const note = notes.find(n => n.id === expandedId);
      if (note) {
        setEditTitle(note.title);
        setEditContent(note.content || '');
        setEditColor(note.color || COLORS[0]);
      }
    }
  }, [expandedId, notes]);

  const handleSave = async () => {
    if (!expandedId) return;
    await onUpdateNote({
      id: expandedId,
      title: editTitle,
      content: editContent,
      color: editColor
    });
    setExpandedId(null);
  };

  const handleDelete = async () => {
    if (!expandedId) return;
    if (confirm('Delete this note?')) {
      await onDeleteNote(expandedId);
      setExpandedId(null);
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-white border-end position-relative" style={{ width: '280px', minWidth: '280px' }}>
      <div className="p-3 border-bottom bg-light">
        <h6 className="m-0 text-muted fw-bold text-uppercase small">{title}</h6>
      </div>
      
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
        {notes.length === 0 && (
            <div className="text-center text-muted small mt-5">
                No notes for this period.
                <br/>
                Click the icon above to add one.
            </div>
        )}
        
        {notes.map(note => (
          <Card 
            key={note.id}
            className="border-0 shadow-sm cursor-pointer hover-shadow transition-all"
            style={{ backgroundColor: note.color || '#fff9c4', cursor: 'pointer' }}
            onDoubleClick={() => setExpandedId(note.id)}
          >
            <Card.Body className="p-3">
              <div className="fw-bold text-truncate mb-1">{note.title}</div>
              <div 
                className="text-muted small" 
                style={{ 
                   display: '-webkit-box', 
                   WebkitLineClamp: 3, 
                   WebkitBoxOrient: 'vertical', 
                   overflow: 'hidden' 
                }}
              >
                {note.content}
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Expanded Editor Overlay */}
      {expandedId && (
        <div 
            className="position-absolute top-0 start-0 w-100 h-100 bg-white d-flex flex-column shadow-lg" 
            style={{ zIndex: 10, transition: 'all 0.3s ease' }}
        >
          <div 
            className="p-3 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: editColor, transition: 'background-color 0.3s' }}
          >
            <div className="d-flex gap-1">
                {COLORS.map(c => (
                    <div 
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{ 
                            width: 16, height: 16, 
                            backgroundColor: c, 
                            borderRadius: '50%', 
                            cursor: 'pointer',
                            border: editColor === c ? '2px solid black' : '1px solid #00000020'
                        }}
                    />
                ))}
            </div>
            <CloseButton onClick={() => handleSave()} />
          </div>
          
          <div className="p-3 flex-grow-1 d-flex flex-column" style={{ backgroundColor: editColor }}>
            <Form.Control 
                type="text" 
                className="bg-transparent border-0 fw-bold fs-5 mb-2 p-0 shadow-none"
                placeholder="Title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
            />
            <Form.Control 
                as="textarea" 
                className="bg-transparent border-0 flex-grow-1 p-0 shadow-none"
                style={{ resize: 'none' }}
                placeholder="Content..."
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleNoteKeyDown(e, editContent, setEditContent)}
            />
          </div>
          
          <div className="p-3 border-top bg-light d-flex justify-content-between">
            <Button variant="outline-danger" size="sm" onClick={handleDelete}>
                <HiOutlineTrash />
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleSave()}>
                Save & Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextNotesPanel;
