import { DragOverlay, useDndContext } from '@dnd-kit/core';
import { Card } from 'react-bootstrap';
import { HiOutlineDocumentText, HiOutlineCalendarDays } from 'react-icons/hi2';

export const DragOverlayWrapper = () => {
  const { active } = useDndContext();

  if (!active) return null;

  const type = active.data.current?.type;

  return (
    <DragOverlay dropAnimation={null}>
      {type === 'note' && (
        <Card 
            className="shadow-lg border-0"
            style={{ 
                width: '150px', 
                height: '100px', 
                backgroundColor: active.data.current?.color || '#fff9c4',
                opacity: 0.8, 
                transform: 'rotate(5deg)', 
                cursor: 'grabbing'
            }}
        >
            <Card.Body className="d-flex align-items-center justify-content-center flex-column text-muted">
                 <HiOutlineDocumentText size={32} />
                 <small className="fw-bold mt-1">New Note</small>
            </Card.Body>
        </Card>
      )}

      {type === 'event' && (
        <Card 
            className="shadow-lg border-0 text-white"
            style={{ 
                width: '200px', 
                height: '40px', 
                backgroundColor: active.data.current?.color || '#6366f1',
                opacity: 0.9, 
                borderRadius: '6px',
                cursor: 'grabbing',
                transform: 'rotate(-2deg)'
            }}
        >
            <div className="d-flex align-items-center px-2 h-100 gap-2">
                 <HiOutlineCalendarDays />
                 <span className="fw-bold small flex-grow-1 text-truncate">New Event</span>
                 <span className="small opacity-75">12:00</span>
            </div>
        </Card>
      )}
    </DragOverlay>
  );
};
