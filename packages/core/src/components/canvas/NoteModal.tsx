import { Modal, Form, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import { handleNoteKeyDown } from '../../utils/editorUtils';

interface NoteModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  note: any | null; // If null, creating new
}

const COLORS = [
  '#fff9c4', // Yellow (Default)
  '#d1e7dd', // Green
  '#cff4fc', // Blue
  '#f8d7da', // Red
  '#e2e3e5', // Grey
  '#fff3cd', // Orange-ish
  '#d1c4e9', // Purple
  '#ffffff', // White
];

export const NoteModal = ({ show, onHide, onSave, onDelete, note }: NoteModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  // Reset form when modal opens
  useEffect(() => {
    if (show && note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || COLORS[0]);
    } else if (show && !note) {
      setTitle('');
      setContent('');
      setColor(COLORS[0]);
    }
  }, [show, note]);

  const handleSave = () => {
    onSave({
      id: note?.id, // undefined if new
      title,
      content,
      color,
    });
    onHide();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
       handleSave();
    } else {
       // Pass setContent to update state with auto-numbering
       // The utility expects (e, content, setContent)
       // We wrap setContent to ensure type compatibility if needed, 
       // but here setContent is (val: string) => void which matches.
       // However, the utility implementation I saw earlier takes (e, content, setContent).
       // Let's verify signature match.
       // The utility signature: (e: React.KeyboardEvent<HTMLTextAreaElement>, content: string, setContent: (val: string) => void)
       
       // We need to handle the state update manually because the utility calls setContent but doesn't return the new value directly in a way that respects React's batching if we were using functional updates, but here direct value is fine.
       // Wait, the utility uses setContent(newContent).
       // We also need to handle the cursor position. The utility does a setTimeout hack.
       
       // Since we are inside a functional component, we can just pass setContent.
       // But wait, the utility modifies the textarea value directly? No, it calls setContent.
       
       // Let's just implement the logic here directly or wrap it?
       // The utility is:
       // export const handleNoteKeyDown = (e, content, setContent) => { ... }
       
       // We need to pass the current content state.
       // And the setContent function.
       
       // One catch: the utility calls e.preventDefault().
       
       handleNoteKeyDown(e, content, setContent);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0" style={{ backgroundColor: color }}>
        <Modal.Title className="fs-6 text-muted">
            {note ? 'Edit Note' : 'New Note'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: color, transition: 'background-color 0.2s' }}>
        <Form>
            <Form.Group className="mb-3">
                <Form.Control 
                    type="text" 
                    placeholder="Title"
                    className="fw-bold border-0 bg-transparent shadow-none fs-5 p-0"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Control 
                    as="textarea" 
                    placeholder="Take a note..."
                    className="border-0 bg-transparent shadow-none p-0"
                    style={{ minHeight: '200px', resize: 'none' }}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </Form.Group>

            {/* Color Picker */}
            <div className="d-flex gap-2 pt-3 border-top border-dark border-opacity-10">
                {COLORS.map(c => (
                    <div 
                        key={c}
                        onClick={() => setColor(c)}
                        title={c}
                        style={{ 
                            width: 24, height: 24, 
                            backgroundColor: c, 
                            borderRadius: '50%', 
                            cursor: 'pointer',
                            border: color === c ? '2px solid #555' : '1px solid rgba(0,0,0,0.1)',
                            boxShadow: color === c ? '0 0 0 1px #fff' : 'none'
                        }}
                    />
                ))}
            </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between" style={{ backgroundColor: color }}>
        <div>
            {note && onDelete && (
                <Button 
                    variant="link" 
                    className="text-danger p-0 text-decoration-none"
                    onClick={() => {
                        if (confirm('Delete this note?')) {
                            onDelete(note.id);
                            onHide();
                        }
                    }}
                >
                    <HiOutlineTrash size={20} />
                </Button>
            )}
        </div>
        <div className="d-flex gap-2">
            <Button variant="light" size="sm" onClick={onHide} className="bg-white bg-opacity-50 border-0">Cancel</Button>
            <Button variant="dark" size="sm" onClick={handleSave}>Save</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
