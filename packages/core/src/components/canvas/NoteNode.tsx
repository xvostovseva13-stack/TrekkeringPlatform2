import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, Form } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';
import { handleNoteKeyDown } from '../../utils/editorUtils';

const NoteNode = ({ id, data }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [title, setTitle] = useState(data.label as string);
  const [content, setContent] = useState(data.content as string);
  const [color, setColor] = useState((data.color as string) || '#fff9c4');
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(data.label as string);
    setContent(data.content as string);
    setColor((data.color as string) || '#fff9c4');
  }, [data]);

  const handleSave = async () => {
    setIsEditing(false);
    // Sync with DB
    if (data.dataSourceId && window.electron && window.electron.db) {
      await window.electron.db.updateNote({
        id: data.dataSourceId as string,
        title,
        content,
        color
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete && typeof data.onDelete === 'function') {
      (data.onDelete as (id: string) => void)(id);
    }
  };

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, title, content, color, data.dataSourceId]); // Dependencies for handleSave closure

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
       handleSave();
    } else {
       handleNoteKeyDown(e, content, setContent);
    }
  };

  return (
    <Card 
      ref={nodeRef}
      style={{ width: '200px', minHeight: '150px', backgroundColor: color }} 
      className="shadow-sm border-0"
      onDoubleClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
      
      {/* Delete Button */}
      {isHovered && !isEditing && (
        <div 
          className="position-absolute top-0 end-0 p-2 fade-in nodrag" 
          style={{ zIndex: 10, cursor: 'pointer', opacity: 0.6 }}
          onClick={handleDelete}
          title="Remove from canvas"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <BsTrash size={16} color="#444" />
        </div>
      )}

      <Card.Body className="d-flex flex-column p-2">
        {isEditing ? (
          <>
            <Form.Control 
              autoFocus
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="mb-2 fw-bold bg-white bg-opacity-50 border-0 p-1 nodrag"
              size="sm"
            />
            <Form.Control 
              as="textarea" 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow-1 bg-white bg-opacity-50 border-0 p-1 nodrag"
              style={{ resize: 'none', fontSize: '0.85rem' }}
            />
          </>
        ) : (
          <>
            <h6 className="fw-bold mb-2 text-truncate">{title}</h6>
            <div className="small text-muted flex-grow-1 text-break" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {content || '(Double click to edit)'}
            </div>
          </>
        )}
      </Card.Body>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" />
    </Card>
  );
};

export default memo(NoteNode);
