import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';

const NoteNode = ({ id, data }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract data from props
  const title = data.label as string;
  const content = data.content as string;
  const color = (data.color as string) || '#fff9c4';

  const handleDoubleClick = () => {
    if (data.onEdit && typeof data.onEdit === 'function') {
      // @ts-ignore
      data.onEdit(data.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete && typeof data.onDelete === 'function') {
      (data.onDelete as (id: string) => void)(id);
    }
  };

  return (
    <Card 
      style={{ width: '200px', minHeight: '150px', backgroundColor: color, cursor: 'pointer' }} 
      className="shadow-sm border-0"
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Handle: both source and target overlay */}
      <Handle type="target" position={Position.Top} id="t-t" className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Top} id="t-s" className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />

      {/* Bottom Handle */}
      <Handle type="target" position={Position.Bottom} id="b-t" className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Bottom} id="b-s" className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />

      {/* Left Handle */}
      <Handle type="target" position={Position.Left} id="l-t" className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Left} id="l-s" className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />

      {/* Right Handle */}
      <Handle type="target" position={Position.Right} id="r-t" className="w-16 !bg-teal-500" />
      <Handle type="source" position={Position.Right} id="r-s" className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />
      
      {/* Delete Button */}
      {isHovered && (
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
        <h6 className="fw-bold mb-2 text-truncate">{title}</h6>
        <div className="small text-muted flex-grow-1 text-break" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {content || '(Double click to edit)'}
        </div>
      </Card.Body>
    </Card>
  );
};

export default memo(NoteNode);