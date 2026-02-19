import { useEffect, useState } from 'react';
import { Modal, Button, Form, Collapse, Row, Col } from 'react-bootstrap';
import { HiTrash, HiChevronDown, HiChevronUp } from 'react-icons/hi2';

interface HabitModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (habitData: any) => void;
  onDelete?: (id: string) => void;
  habit?: any | null; // If null, creating new
}

export const HabitModal = ({ show, onHide, onSave, onDelete, habit }: HabitModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Schedule State
  const [showFrequency, setShowFrequency] = useState(false);
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [workDays, setWorkDays] = useState(1);
  const [restDays, setRestDays] = useState(1);

  useEffect(() => {
    if (show) {
      if (habit) {
        setTitle(habit.title || '');
        setDescription(habit.description || '');
        
        // Parse Frequency
        const freq = habit.frequency || 'daily';
        if (freq.startsWith('schedule:')) {
            setIsCustomSchedule(true);
            const parts = freq.split(':');
            setWorkDays(parseInt(parts[1]) || 1);
            setRestDays(parseInt(parts[2]) || 1);
            setShowFrequency(true); // Auto-expand if custom
        } else {
            setIsCustomSchedule(false);
            setWorkDays(1);
            setRestDays(1);
        }
      } else {
        // Reset for new
        setTitle('');
        setDescription('');
        setIsCustomSchedule(false);
        setWorkDays(1);
        setRestDays(1);
        setShowFrequency(false);
      }
    }
  }, [show, habit]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    // Construct Frequency String
    let frequency = 'daily';
    if (isCustomSchedule) {
        frequency = `schedule:${workDays}:${restDays}`;
    }

    onSave({
      id: habit?.id,
      title,
      description,
      frequency,
      completedDates: habit?.completedDates // Preserve existing data
    });
  };

  const handleDelete = () => {
      if (habit?.id && onDelete) {
          if (confirm('Are you sure you want to delete this habit?')) {
              onDelete(habit.id);
          }
      }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fs-5 fw-bold">
          {habit ? 'Edit Habit' : 'New Habit'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Read 30 mins"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add details or motivation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          {/* Collapsible Frequency Section */}
          <div className="mb-3">
              <div 
                className="d-flex align-items-center justify-content-between cursor-pointer user-select-none text-muted"
                onClick={() => setShowFrequency(!showFrequency)}
                style={{ cursor: 'pointer' }}
              >
                  <span className="small fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                      Schedule
                  </span>
                  {showFrequency ? <HiChevronUp /> : <HiChevronDown />}
              </div>
              
              <Collapse in={showFrequency}>
                  <div className="mt-3 ps-2 border-start border-2">
                      <Form.Check 
                        type="switch"
                        id="custom-schedule-switch"
                        label="Custom Schedule (X days ON, Y days OFF)"
                        checked={isCustomSchedule}
                        onChange={(e) => setIsCustomSchedule(e.target.checked)}
                        className="mb-3"
                      />

                      {isCustomSchedule && (
                          <Row>
                              <Col xs={6}>
                                  <Form.Group>
                                      <Form.Label className="small text-muted">Work Days</Form.Label>
                                      <Form.Control 
                                        type="number" 
                                        min={1} 
                                        value={workDays}
                                        onChange={(e) => setWorkDays(Math.max(1, parseInt(e.target.value) || 1))}
                                      />
                                      <Form.Text className="text-muted" style={{fontSize: '0.7rem'}}>
                                          Days active
                                      </Form.Text>
                                  </Form.Group>
                              </Col>
                              <Col xs={6}>
                                  <Form.Group>
                                      <Form.Label className="small text-muted">Rest Days</Form.Label>
                                      <Form.Control 
                                        type="number" 
                                        min={1} 
                                        value={restDays}
                                        onChange={(e) => setRestDays(Math.max(1, parseInt(e.target.value) || 1))}
                                      />
                                      <Form.Text className="text-muted" style={{fontSize: '0.7rem'}}>
                                          Days off
                                      </Form.Text>
                                  </Form.Group>
                              </Col>
                          </Row>
                      )}
                      
                      {!isCustomSchedule && (
                          <div className="text-muted small fst-italic">
                              Standard daily habit (Every day).
                          </div>
                      )}
                  </div>
              </Collapse>
          </div>

        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 justify-content-between">
        <div>
            {habit && onDelete && (
                <Button variant="link" className="text-danger p-0 text-decoration-none" onClick={handleDelete}>
                    <HiTrash className="me-1" /> Delete
                </Button>
            )}
        </div>
        <div className="d-flex gap-2">
            <Button variant="light" onClick={onHide}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!title.trim()}>
            {habit ? 'Save Changes' : 'Create Habit'}
            </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
