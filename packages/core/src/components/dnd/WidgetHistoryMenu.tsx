import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, Spinner } from 'react-bootstrap';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { HiOutlineClock } from 'react-icons/hi2';

interface RecentItem {
  id: string;
  title: string;
  createdAt: string;
  [key: string]: any;
}

interface WidgetHistoryMenuProps {
  show: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number } | null;
  type: 'note' | 'habit' | 'event';
}

const HistoryItem = ({ item, type }: { item: RecentItem, type: string }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `history-${type}-${item.id}`,
    data: {
      type, // 'note', 'habit', etc.
      source: 'history',
      originalId: item.id, // The ID of the existing entity
      // Pass minimal data needed for preview
      title: item.title,
      color: item.color
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 mb-2 bg-white rounded border hover-bg-light shadow-sm d-flex flex-column gap-1"
    >
      <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>
        {item.title || 'Untitled'}
      </div>
      <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
        <HiOutlineClock size={10} />
        {dayjs(item.createdAt).format('MMM D, HH:mm')}
      </div>
    </div>
  );
};

export const WidgetHistoryMenu = ({ show, onClose, anchorPosition, type }: WidgetHistoryMenuProps) => {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && type) {
      setLoading(true);
      if (window.electron) {
        window.electron.db.getRecentItems({ type, limit: 3 })
          .then((data: any) => setItems(data))
          .catch((err: any) => console.error("Failed to fetch recent items", err))
          .finally(() => setLoading(false));
      }
    }
  }, [show, type]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Logic handled by parent or overlay usually, but simple check:
      if (show) {
          // If the click is not on the menu...
          // For simplicity, we can use a transparent backdrop in the component itself
      }
    };
    if (show) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose]);

  if (!show || !anchorPosition) return null;

  return createPortal(
    <>
      {/* Backdrop to close menu */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-transparent" 
        style={{ zIndex: 1050 }} 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      
      {/* Menu */}
      <Card 
        className="position-fixed shadow-lg border-0"
        style={{ 
          top: anchorPosition.y, 
          left: anchorPosition.x, 
          width: '200px', 
          zIndex: 1051,
          animation: 'fadeIn 0.1s ease-out'
        }}
      >
        <Card.Header className="py-2 bg-light text-muted small fw-bold">
           Recent {type}s
        </Card.Header>
        <Card.Body className="p-2 bg-light">
          {loading ? (
            <div className="text-center py-2"><Spinner size="sm" /></div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted small py-2">No recent items</div>
          ) : (
            items.map(item => (
              <HistoryItem key={item.id} item={item} type={type} />
            ))
          )}
        </Card.Body>
      </Card>
    </>,
    document.body
  );
};
