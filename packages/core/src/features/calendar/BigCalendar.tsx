import { Calendar, dayjsLocalizer, SlotInfo, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dayjsLocalizer(dayjs);

interface BigCalendarProps {
  date: Date;
  view: View; // 'month' | 'week' | 'day' (Year is handled outside)
  events: any[];
  onNavigate: (newDate: Date) => void;
  onView: (newView: View) => void;
  onSelectSlot: (slotInfo: SlotInfo) => void;
}

const BigCalendar = ({ date, view, events, onNavigate, onView, onSelectSlot }: BigCalendarProps) => {
  
  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.color || '#6366f1'; // Default Indigo
    // Determine text color for contrast (simple logic)
    const isLight = ['#fff9c4', '#d1e7dd', '#cff4fc', '#f8d7da', '#e2e3e5', '#fff3cd'].includes(backgroundColor);
    const color = isLight ? '#000000' : '#ffffff';

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        opacity: 0.9,
        display: 'block'
      }
    };
  };

  return (
    <div className="h-100">
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            selectable
            onSelectSlot={onSelectSlot}
            date={date}
            view={view}
            onNavigate={onNavigate}
            onView={onView}
            toolbar={false} 
            eventPropGetter={eventStyleGetter}
        />
    </div>
  );
};

export default BigCalendar;
