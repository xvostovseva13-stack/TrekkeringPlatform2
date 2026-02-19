import { Modal, Form, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import dayjs from 'dayjs';

interface EventModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  event: any | null; // If null, creating new
  initialDate?: Date; // Default date for new event
}

const COLORS = [
  '#fff9c4', '#d1e7dd', '#cff4fc', '#f8d7da', '#e2e3e5', '#fff3cd', '#6366f1'
];

export const EventModal = ({ show, onHide, onSave, onDelete, event, initialDate }: EventModalProps) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[6]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (event) {
        // Editing existing
        setTitle(event.title);
        setColor(event.color || COLORS[6]);
        setStartDate(dayjs(event.start).format('YYYY-MM-DD'));
        setStartTime(dayjs(event.start).format('HH:mm'));
        setEndDate(dayjs(event.end).format('YYYY-MM-DD'));
        setEndTime(dayjs(event.end).format('HH:mm'));
      } else {
        // Creating new
        const start = initialDate || new Date();
        const end = dayjs(start).add(1, 'hour').toDate();
        
        setTitle('');
        setColor(COLORS[6]);
        setStartDate(dayjs(start).format('YYYY-MM-DD'));
        setStartTime(dayjs(start).format('HH:mm'));
        setEndDate(dayjs(end).format('YYYY-MM-DD'));
        setEndTime(dayjs(end).format('HH:mm'));
      }
    }
  }, [show, event, initialDate]);

  const handleSave = () => {
    const start = dayjs(`${startDate}T${startTime}`).toDate();
    const end = dayjs(`${endDate}T${endTime}`).toDate();

    onSave({
      id: event?.id, // undefined if new
      title,
      color,
      start,
      end,
      allDay: false
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-6 text-muted">
            {event ? 'Edit Event' : 'New Event'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
            <Form.Group className="mb-3">
                <Form.Control 
                    type="text" 
                    placeholder="Event Title"
                    className="fw-bold"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                />
            </Form.Group>

            {/* Color Picker */}
            <div className="d-flex gap-2 mb-3">
                {COLORS.map(c => (
                    <div 
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ 
                            width: 24, height: 24, 
                            backgroundColor: c, 
                            borderRadius: '50%', 
                            cursor: 'pointer',
                            border: color === c ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)'
                        }}
                    />
                ))}
            </div>

            {/* Date & Time */}
            <div className="mb-2">
                <div className="small text-muted mb-1">Start</div>
                <div className="d-flex gap-2">
                    <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} size="sm" />
                    <Form.Control type="time" value={startTime} onChange={e => setStartTime(e.target.value)} size="sm" />
                </div>
            </div>
            
            <div className="mb-2">
                <div className="small text-muted mb-1">End</div>
                <div className="d-flex gap-2">
                    <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} size="sm" />
                    <Form.Control type="time" value={endTime} onChange={e => setEndTime(e.target.value)} size="sm" />
                </div>
            </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
        <div>
            {event && onDelete && (
                <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => {
                        if (confirm('Delete this event?')) {
                            onDelete(event.id);
                            onHide();
                        }
                    }}
                >
                    <HiOutlineTrash />
                </Button>
            )}
        </div>
        <div className="d-flex gap-2">
            <Button variant="secondary" size="sm" onClick={onHide}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!title}>Save</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
