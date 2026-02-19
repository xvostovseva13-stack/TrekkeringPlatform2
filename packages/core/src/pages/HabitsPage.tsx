import { useState, useEffect, useCallback } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { HiOutlinePlus, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import dayjs from 'dayjs';
import HabitCard from '../features/habits/HabitCard';
import HabitsSummary from '../features/habits/HabitsSummary';
import { HabitModal } from '../features/habits/HabitModal';

const HabitsPage = () => {
  const [date, setDate] = useState(new Date()); // Current view date
  const [habits, setHabits] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any | null>(null);

  // Load Data
  const fetchHabits = useCallback(async () => {
    if (!window.electron) return;
    try {
      const data = await window.electron.db.getHabits();
      setHabits(data);
    } catch (e) {
      console.error("Failed to load habits", e);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Handlers
  const handleSave = async (habitData: any) => {
    if (!window.electron) return;
    try {
      if (habitData.id) {
          // Update
          await window.electron.db.updateHabit({
              id: habitData.id,
              title: habitData.title,
              description: habitData.description,
              frequency: habitData.frequency
          });
      } else {
          // Create
          await window.electron.db.createHabit({
              title: habitData.title,
              description: habitData.description,
              frequency: habitData.frequency || 'daily'
          });
      }
      setShowModal(false);
      setEditingHabit(null);
      fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (habit: any) => {
      setEditingHabit(habit);
      setShowModal(true);
  };

  const handleCreateNew = () => {
      setEditingHabit(null);
      setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.electron) return;
    // Confirmation handled in Modal usually, but if called from Card:
    if (confirm('Delete this habit?')) {
        await window.electron.db.deleteHabit({ id });
        fetchHabits();
        setShowModal(false); // Close modal if open
    }
  };
  
  // Handled by modal for internal delete
  const handleDeleteFromModal = async (id: string) => {
      if (!window.electron) return;
      await window.electron.db.deleteHabit({ id });
      fetchHabits();
      setShowModal(false);
  };

  const handleToggleDate = async (id: string, dateStr: string) => {
    if (!window.electron) return;
    
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    let completedDates: string[] = [];
    try {
        completedDates = JSON.parse(habit.completedDates || '[]');
    } catch {
        completedDates = [];
    }

    if (completedDates.includes(dateStr)) {
        completedDates = completedDates.filter(d => d !== dateStr);
    } else {
        completedDates.push(dateStr);
    }

    completedDates.sort();

    try {
        await window.electron.db.updateHabit({
            id,
            completedDates: JSON.stringify(completedDates)
        });
        fetchHabits();
    } catch (e) {
        console.error("Failed to toggle habit", e);
    }
  };

  const handleNavigate = (direction: 'PREV' | 'NEXT') => {
    const newDate = direction === 'PREV' 
        ? dayjs(date).subtract(1, 'month') 
        : dayjs(date).add(1, 'month');
    setDate(newDate.toDate());
  };

  return (
    <div className="h-100 d-flex flex-column bg-light overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
        <div className="d-flex align-items-center gap-3">
            <h4 className="m-0 fw-bold">Habits</h4>
            <div className="d-flex align-items-center bg-light rounded-pill px-2 py-1 border">
                <Button variant="link" className="p-0 text-dark" onClick={() => handleNavigate('PREV')}>
                    <HiChevronLeft />
                </Button>
                <span className="mx-3 fw-bold small" style={{ minWidth: '100px', textAlign: 'center' }}>
                    {dayjs(date).format('MMMM YYYY')}
                </span>
                <Button variant="link" className="p-0 text-dark" onClick={() => handleNavigate('NEXT')}>
                    <HiChevronRight />
                </Button>
            </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleCreateNew}>
            <HiOutlinePlus className="me-1" /> New Habit
        </Button>
      </div>

      {/* Content */}
      <div className="flex-grow-1 overflow-auto p-4">
        <Container fluid="lg">
            {/* Summary Widget */}
            <HabitsSummary habits={habits} date={date} />

            {habits.length === 0 ? (
                <div className="text-center text-muted mt-5">
                    <h5>No habits yet</h5>
                    <p>Start tracking your daily goals by adding a new habit.</p>
                    <Button variant="outline-primary" onClick={handleCreateNew}>
                        Create First Habit
                    </Button>
                </div>
            ) : (
                <Row>
                    {habits.map(habit => (
                        <Col xs={12} key={habit.id}>
                            <HabitCard 
                                habit={habit} 
                                date={date} 
                                onToggleDate={handleToggleDate}
                                onDelete={handleDelete}
                                onDoubleClick={handleEdit}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
      </div>

      {/* Create/Edit Modal */}
      <HabitModal 
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        habit={editingHabit}
      />
    </div>
  );
};

export default HabitsPage;
