import { Card, Dropdown, Badge } from 'react-bootstrap';
import { HiEllipsisVertical, HiTrash, HiCheck, HiFire, HiOutlineMap, HiTrophy } from 'react-icons/hi2';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { isHabitRestDay, calculateHabitStats } from '../../utils/habitUtils';

interface HabitCardProps {
  habit: any;
  date: Date; // Current reference date
  onToggleDate: (id: string, dateStr: string) => void;
  onDelete: (id: string) => void;
  onDoubleClick?: (habit: any) => void;
}

const HabitCard = ({ habit, date, onToggleDate, onDelete, onDoubleClick }: HabitCardProps) => {
  const currentMonth = dayjs(date);
  const daysInMonth = currentMonth.daysInMonth();
  
  // Parse completed dates
  let completedDates: string[] = [];
  try {
    completedDates = JSON.parse(habit.completedDates || '[]');
  } catch (e) {
    completedDates = [];
  }

  const { currentStreak, bestStreak } = calculateHabitStats(habit);

  // Generate linear days array
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    return currentMonth.date(i + 1);
  });

  return (
    <Card 
      className="border-0 shadow-sm mb-3 overflow-hidden cursor-pointer"
      onDoubleClick={() => onDoubleClick && onDoubleClick(habit)}
    >
      <Card.Body className="p-3">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
             <div className="d-flex align-items-center gap-3">
                 <h5 className="m-0 fw-bold text-dark">{habit.title}</h5>
                 <div className="d-flex gap-2">
                     {currentStreak > 0 && (
                         <div className="d-flex align-items-center text-orange px-2 py-1 rounded-pill bg-orange-subtle small fw-bold" style={{ color: '#f97316', backgroundColor: '#ffedd5' }} title="Current Streak">
                             <HiFire className="me-1" /> {currentStreak}
                         </div>
                     )}
                     {bestStreak > 0 && (
                         <div className="d-flex align-items-center text-warning px-2 py-1 rounded-pill bg-warning-subtle small fw-bold" style={{ color: '#ca8a04', backgroundColor: '#fef9c3' }} title="Best Streak">
                             <HiTrophy className="me-1" /> {bestStreak}
                         </div>
                     )}
                 </div>
             </div>
             <Dropdown align="end">
                <Dropdown.Toggle as={CustomToggle} id={`dropdown-${habit.id}`} />
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => onDelete(habit.id)} className="text-danger">
                        <HiTrash className="me-2" /> Delete
                    </Dropdown.Item>
                </Dropdown.Menu>
             </Dropdown>
        </div>

        {/* Description */}
        {habit.description && (
            <div className="text-muted small mb-3" style={{ fontSize: '0.85rem' }}>
                {habit.description}
            </div>
        )}

        {/* Linear Tracker Grid */}
        <div className="d-flex flex-column mb-2">
            {/* Dates Header */}
            <div className="d-flex gap-1 overflow-hidden mb-1">
                {days.map(day => (
                    <div 
                        key={`label-${day.date()}`} 
                        className={clsx(
                            "text-center text-muted small fw-bold",
                            (day.day() === 0 || day.day() === 6) ? "text-danger opacity-50" : "" 
                        )}
                        style={{ width: '32px', fontSize: '0.7rem' }}
                    >
                        {day.date()}
                    </div>
                ))}
            </div>

            {/* Checkboxes */}
            <div className="d-flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {days.map(day => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const isCompleted = completedDates.includes(dateStr);
                    const isToday = day.isSame(dayjs(), 'day');
                    const isRestDay = isHabitRestDay(habit, day);

                    return (
                        <div 
                            key={dateStr}
                            className={clsx(
                                "rounded-3 d-flex align-items-center justify-content-center cursor-pointer transition-all flex-shrink-0 user-select-none",
                                isCompleted 
                                    ? "bg-primary text-white shadow-sm" 
                                    : isRestDay 
                                        ? "text-muted" // Rest day base
                                        : "bg-light border border-light-subtle text-transparent hover-bg-gray-200",
                                isToday && !isCompleted && !isRestDay && "ring-2 ring-primary ring-offset-1 border-primary"
                            )}
                            style={{ 
                                width: '32px', 
                                height: '32px',
                                transition: 'all 0.2s ease',
                                // High visibility stripe pattern for rest days
                                background: isRestDay && !isCompleted 
                                    ? 'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 4px, #dee2e6 4px, #dee2e6 6px)' 
                                    : undefined,
                                border: isRestDay && !isCompleted ? '1px solid #dee2e6' : undefined
                            }}
                            onClick={(e) => {
                                e.stopPropagation(); // Don't trigger card click
                                onToggleDate(habit.id, dateStr);
                            }}
                            title={`${day.format('D MMMM YYYY')}${isRestDay ? ' (Rest Day)' : ''}`}
                        >
                            <HiCheck className={clsx("fs-6", isCompleted ? "opacity-100" : "opacity-0")} />
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Usage Indicators */}
        {habit.usedIn && habit.usedIn.length > 0 && (
            <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-light">
                <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Active in:</span>
                {habit.usedIn.map((usage: any, idx: number) => (
                    <Badge 
                        key={idx} 
                        bg="light" 
                        className="text-secondary border fw-normal d-flex align-items-center gap-1"
                    >
                        {usage.containerType === 'canvas' && <HiOutlineMap />}
                        {usage.containerType === 'canvas' ? 'Canvas' : usage.containerType}
                    </Badge>
                ))}
            </div>
        )}
      </Card.Body>
    </Card>
  );
};

// Custom Dropdown Toggle to remove arrow
import React from 'react';
const CustomToggle = React.forwardRef(({ onClick }: any, ref: any) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="btn btn-link text-muted p-0"
  >
    <HiEllipsisVertical className="fs-5" />
  </button>
));

export default HabitCard;
