import dayjs from 'dayjs';
import { Row, Col, Card } from 'react-bootstrap';

interface YearViewProps {
  date: Date; // The currently selected date (sets the year)
  events: any[]; // List of events/notes to show dots for
  onMonthClick: (date: Date) => void;
}

const YearView = ({ date, events, onMonthClick }: YearViewProps) => {
  const currentYear = dayjs(date).year();
  const months = Array.from({ length: 12 }, (_, i) => dayjs(new Date(currentYear, i, 1)));

  return (
    <div className="h-100 p-2">
      <Row className="g-3 h-100">
        {months.map(month => (
          <Col xs={12} sm={6} md={4} lg={3} key={month.format('MMM')}>
            <Card 
              className="h-100 shadow-sm border-0 cursor-pointer hover-bg-light" 
              onClick={() => onMonthClick(month.toDate())}
              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
            >
              <Card.Body className="p-2">
                <h6 className="text-primary fw-bold text-center mb-2">{month.format('MMMM')}</h6>
                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', fontSize: '0.6rem' }}>
                  {/* Weekday headers */}
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-muted">{d}</div>
                  ))}
                  
                  {/* Days */}
                  {Array.from({ length: month.startOf('month').day() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: month.daysInMonth() }).map((_, i) => {
                    const day = month.date(i + 1);
                    const isToday = day.isSame(dayjs(), 'day');
                    
                    // Find events that cover this day
                    const dayEvents = events.filter(e => {
                        const start = dayjs(e.start).startOf('day');
                        const end = dayjs(e.end).endOf('day');
                        return day.isBetween(start, end, 'day', '[]');
                    });

                    // Use the color of the first event found, or default
                    const eventColor = dayEvents.length > 0 ? (dayEvents[0].color || '#6366f1') : null;
                    
                    return (
                      <div 
                        key={i} 
                        className={`text-center p-1 rounded-circle position-relative`}
                        style={{
                            backgroundColor: isToday ? 'var(--bs-primary)' : (eventColor ? `${eventColor}40` : 'transparent'), // 40 = 25% opacity
                            color: isToday ? 'white' : 'inherit',
                            cursor: 'pointer'
                        }}
                        onClick={() => onMonthClick(day.toDate())}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default YearView;
