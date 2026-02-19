import { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, Button, ProgressBar } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';
import { HiCheck, HiFire, HiOutlinePlus, HiTrophy } from 'react-icons/hi2';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useTrekkerEvent } from '../../utils/eventBus';
import { isHabitRestDay, calculateHabitStats } from '../../utils/habitUtils';
import { useApi } from '../../context/ApiContext';

const HabitNode = ({ id, data }: NodeProps) => {
  const api = useApi();
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const loadData = useCallback(async () => {
    try {
        if (data.dataSourceId) {
            const all = await api.habits.getAll();
            const found = all.find((h: any) => h.id === data.dataSourceId);
            setSelectedHabit(found || null);
        } else {
            // Logic for 'unselected' node changed, we don't need all habits anymore
            // const all = await api.habits.getAll();
            // setHabits(all);
        }
    } catch (e) {
        console.error("Failed to load habit node data", e);
    }
  }, [data.dataSourceId, api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useTrekkerEvent('HABIT_CHANGED', () => {
      loadData();
  });

  const handleCreateNew = () => {
      if (data.onEdit && typeof data.onEdit === 'function') {
          (data.onEdit as (habit: any | null, widgetId: string) => void)(null, id);
      }
  };

  const handleEdit = () => {
      if (selectedHabit && data.onEdit && typeof data.onEdit === 'function') {
           (data.onEdit as (habit: any | null, widgetId: string) => void)(selectedHabit, id);
      }
  };

  const handleToggleDate = async (dateStr: string) => {
      if (!selectedHabit) return;
      
      let completedDates: string[] = [];
      try {
          completedDates = JSON.parse(selectedHabit.completedDates || '[]');
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
          await api.habits.update({
              id: selectedHabit.id,
              completedDates: JSON.stringify(completedDates)
          });
          
          setSelectedHabit({
              ...selectedHabit,
              completedDates: JSON.stringify(completedDates)
          });
      } catch (e) {
          console.error("Failed to toggle habit", e);
      }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete && typeof data.onDelete === 'function') {
      (data.onDelete as (id: string) => void)(id);
    }
  };

  // Selection Mode
  if (!selectedHabit && !data.dataSourceId) {
      return (
        <Card style={{ width: '220px' }} className="shadow-sm border-0">
            <Card.Body className="p-3 d-flex flex-column align-items-center justify-content-center text-center">
                <h6 className="small fw-bold mb-2 text-muted">No Habit Selected</h6>
                <Button variant="outline-primary" size="sm" onClick={handleCreateNew} className="w-100">
                    <HiOutlinePlus className="me-1" /> Setup Habit
                </Button>
            </Card.Body>
            <div className="position-absolute top-0 end-0 p-1" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={handleDelete}>
                 <BsTrash size={12} />
            </div>
        </Card>
      );
  }

  if (!selectedHabit) return null;

  const { currentStreak, bestStreak, percentage } = calculateHabitStats(selectedHabit);
  const completedDates = JSON.parse(selectedHabit.completedDates || '[]');
  
  // Generate 7 days: 4 past, today, 2 future
  // i=0 -> today-4
  // i=4 -> today
  // i=6 -> today+2
  const days = Array.from({ length: 7 }, (_, i) => {
      return dayjs().subtract(4 - i, 'day');
  });

  return (
    <Card 
      style={{ width: '260px', backgroundColor: '#ffffff' }} 
      className="shadow-sm border-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleEdit}
    >
        <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" />
        <Handle type="source" position={Position.Top} className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />
        <Handle type="target" position={Position.Bottom} className="w-16 !bg-teal-500" />
        <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />
        <Handle type="target" position={Position.Left} className="w-16 !bg-teal-500" />
        <Handle type="source" position={Position.Left} className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />
        <Handle type="target" position={Position.Right} className="w-16 !bg-teal-500" />
        <Handle type="source" position={Position.Right} className="w-16 !bg-teal-500" style={{ zIndex: 1 }} />

        {isHovered && (
            <div 
            className="position-absolute top-0 end-0 p-2 fade-in nodrag" 
            style={{ zIndex: 10, cursor: 'pointer', opacity: 0.6 }}
            onClick={handleDelete}
            title="Remove widget"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            >
            <BsTrash size={16} color="#444" />
            </div>
        )}

        <Card.Body className="p-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold text-truncate me-2" title={selectedHabit.title}>
                    {selectedHabit.title}
                </div>
                <div className="d-flex gap-1">
                    {currentStreak > 0 && (
                        <div className="d-flex align-items-center text-orange px-1 rounded-pill small fw-bold" style={{ color: '#f97316', fontSize: '0.75rem', backgroundColor: '#ffedd5' }} title="Current Streak">
                            <HiFire className="me-1" /> {currentStreak}
                        </div>
                    )}
                    {bestStreak > 0 && (
                        <div className="d-flex align-items-center text-warning px-1 rounded-pill small fw-bold" style={{ color: '#ca8a04', fontSize: '0.75rem', backgroundColor: '#fef9c3' }} title="Best Streak">
                            <HiTrophy className="me-1" /> {bestStreak}
                        </div>
                    )}
                </div>
            </div>

            {/* Days Grid (Last 7 Days) */}
            <div className="d-flex justify-content-between mb-2">
                {days.map(day => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const isCompleted = completedDates.includes(dateStr);
                    const isToday = day.isSame(dayjs(), 'day');
                    const isFuture = day.isAfter(dayjs(), 'day');
                    const isRestDay = isHabitRestDay(selectedHabit, day);
                    
                    return (
                        <div key={dateStr} className="d-flex flex-column align-items-center gap-1">
                            <span className={clsx("text-muted", isToday && "fw-bold text-primary")} style={{ fontSize: '0.6rem' }}>
                                {day.format('dd')}
                            </span>
                            <div 
                                className={clsx(
                                    "rounded-circle d-flex align-items-center justify-content-center transition-all nodrag",
                                    isCompleted 
                                        ? "bg-primary text-white" 
                                        : isRestDay 
                                            ? "text-muted" // Rest day base
                                            : "bg-light border border-light-subtle",
                                    isToday && !isCompleted && !isRestDay && "ring-1 ring-primary border-primary",
                                    isFuture ? "opacity-50 cursor-default" : "cursor-pointer hover-bg-gray-200"
                                )}
                                style={{ 
                                    width: '24px', 
                                    height: '24px',
                                    transition: 'all 0.2s ease',
                                    // Make today slightly larger visual impact via border
                                    boxShadow: isToday && !isRestDay ? '0 0 0 1px #6366f1' : 'none',
                                    // Striped background for rest days
                                    background: isRestDay && !isCompleted 
                                        ? 'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 4px, #dee2e6 4px, #dee2e6 6px)' 
                                        : undefined,
                                    border: isRestDay && !isCompleted ? '1px solid #dee2e6' : undefined
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Optional: prevent clicking future dates?
                                    // if (isFuture) return; 
                                    handleToggleDate(dateStr);
                                }}
                                title={`${day.format('D MMM')}${isRestDay ? ' (Rest Day)' : ''}`}
                            >
                                <HiCheck className={clsx("fs-6", isCompleted ? "opacity-100" : "opacity-0")} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Progress Bar */}
            <div>
                <div className="d-flex justify-content-between align-items-end mb-1">
                    <span className="text-muted" style={{ fontSize: '0.65rem' }}>Monthly Progress</span>
                    <span className="fw-bold text-primary" style={{ fontSize: '0.7rem' }}>{percentage}%</span>
                </div>
                <ProgressBar 
                    now={percentage} 
                    style={{ height: '4px' }} 
                    className="rounded-pill"
                    variant="primary"
                />
            </div>
        </Card.Body>
    </Card>
  );
};

export default memo(HabitNode);
