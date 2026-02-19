import dayjs from 'dayjs';
import { Card, Button } from 'react-bootstrap';
import { HiOutlineClock, HiOutlinePlus } from 'react-icons/hi2';

interface DayViewProps {
  date: Date;
  events: any[];
  onAddEvent: (start: Date) => void;
  onEditEvent: (event: any) => void;
}

const DayView = ({ date, events, onAddEvent, onEditEvent }: DayViewProps) => {
  const dayEvents = events.filter(e => dayjs(e.start).isSame(date, 'day'));
  
  return (
    <div className="d-flex flex-column h-100 overflow-hidden">
        <div className="d-flex justify-content-between align-items-center mb-3 px-2">
            <h4 className="m-0 fw-bold">{dayjs(date).format('D MMMM, dddd')}</h4>
            <Button size="sm" variant="outline-primary" onClick={() => onAddEvent(dayjs(date).startOf('day').toDate())}>
                <HiOutlinePlus className="me-1"/> Add Event
            </Button>
        </div>

        <div className="flex-grow-1 overflow-auto bg-white rounded-3 border shadow-sm p-3">
             {dayEvents.length === 0 ? (
                <div className="text-center text-muted mt-5">
                    No events for this day.
                </div>
             ) : (
                <div className="d-flex flex-column gap-2">
                    {dayEvents.map(event => {
                        const isZeroDuration = dayjs(event.start).format('HH:mm') === '00:00' && dayjs(event.end).format('HH:mm') === '00:00';
                        const bgColor = event.color || '#6366f1';
                        // Determine text color based on background brightness
                        const isLight = ['#fff9c4', '#d1e7dd', '#cff4fc', '#f8d7da', '#e2e3e5', '#fff3cd'].includes(bgColor);
                        const textColor = isLight ? '#000' : '#fff';

                        return (
                            <Card 
                                key={event.id} 
                                className="border-0 shadow-sm p-3 d-flex flex-row align-items-center justify-content-between cursor-pointer hover-scale"
                                style={{ backgroundColor: bgColor, color: textColor }}
                                onDoubleClick={() => onEditEvent(event)}
                            >
                                <div>
                                    <div className="fw-bold fs-5">{event.title}</div>
                                    {event.description && <div className="small opacity-75 mt-1">{event.description}</div>}
                                </div>
                                <div className="text-end opacity-75 small">
                                    <div className="d-flex align-items-center gap-1">
                                        <HiOutlineClock />
                                        <span>
                                            {event.allDay || isZeroDuration ? '00:00 - 00:00' : `${dayjs(event.start).format('HH:mm')} - ${dayjs(event.end).format('HH:mm')}`}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
             )}
        </div>
    </div>
  );
};

export default DayView;
