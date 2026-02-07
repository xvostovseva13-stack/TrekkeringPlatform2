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
  return (
    <div style={{ height: '100%', minHeight: '600px' }}>
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
            toolbar={false} // We use our custom toolbar
        />
    </div>
  );
};

export default BigCalendar;
