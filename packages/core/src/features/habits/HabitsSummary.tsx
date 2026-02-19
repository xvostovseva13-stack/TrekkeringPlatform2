import { Card } from 'react-bootstrap';
import dayjs from 'dayjs';

interface HabitsSummaryProps {
  habits: any[];
  date: Date;
}

const HabitsSummary = ({ habits, date }: HabitsSummaryProps) => {
  const currentMonth = dayjs(date);
  const daysInMonth = currentMonth.daysInMonth();
  const monthStart = currentMonth.startOf('month').format('YYYY-MM-DD');
  const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');

  // Calculate stats per habit
  const habitStats = habits.map(habit => {
    let completedDates: string[] = [];
    try {
      completedDates = JSON.parse(habit.completedDates || '[]');
    } catch {
      completedDates = [];
    }
    
    const completedInMonth = completedDates.filter(d => d >= monthStart && d <= monthEnd).length;
    const percentage = Math.round((completedInMonth / daysInMonth) * 100);
    
    return {
      ...habit,
      percentage
    };
  });

  // Calculate Total Progress
  const totalPercentage = habitStats.length > 0 
    ? Math.round(habitStats.reduce((acc, h) => acc + h.percentage, 0) / habitStats.length)
    : 0;

  return (
    <Card className="border-0 shadow-sm mb-4 bg-white overflow-hidden">
        {/* Decorative Top Line */}
        <div className="w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)' }} />
        
        <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold mb-1 text-dark">Monthly Overview</h4>
                    <div className="text-muted small">Keep up the momentum!</div>
                </div>
                <div className="text-end">
                    <h2 
                        className="fw-bold m-0 display-4" 
                        style={{ 
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                        }}
                    >
                        {totalPercentage}%
                    </h2>
                    <div className="text-muted small">Total Completion</div>
                </div>
            </div>

            {/* Individual Progress Bars */}
            <div className="d-flex flex-column gap-3">
                {habitStats.map(habit => (
                    <div key={habit.id}>
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="fw-medium text-dark">{habit.title}</span>
                            <span className="text-muted">{habit.percentage}%</span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: '8px', backgroundColor: '#f3f4f6' }}>
                             <div 
                                className="progress-bar rounded-pill"
                                role="progressbar"
                                style={{ 
                                    width: `${habit.percentage}%`,
                                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)' 
                                }}
                                aria-valuenow={habit.percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card.Body>
    </Card>
  );
};

export default HabitsSummary;
