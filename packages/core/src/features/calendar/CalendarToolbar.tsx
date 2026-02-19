import { Button, ButtonGroup } from 'react-bootstrap';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import dayjs from 'dayjs';

type ViewType = 'year' | 'month' | 'day';

interface CalendarToolbarProps {
  date: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
}

const CalendarToolbar = ({ date, view, onViewChange, onNavigate }: CalendarToolbarProps) => {
  
  const getLabel = () => {
    const d = dayjs(date);
    switch (view) {
      case 'year': return d.format('YYYY');
      case 'month': return d.format('MMMM YYYY');
      case 'day': return d.format('D MMM YYYY');
      default: return '';
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white shadow-sm" style={{ minHeight: '50px' }}>
      {/* Left: Empty for now (Widget bar is global) */}
      <div className="d-flex gap-2">
      </div>

      {/* Center: Navigation */}
      <div className="d-flex align-items-center gap-3">
        <ButtonGroup>
            <Button variant="light" size="sm" onClick={() => onNavigate('PREV')}><HiChevronLeft /></Button>
            <Button variant="light" size="sm" onClick={() => onNavigate('TODAY')}>Today</Button>
            <Button variant="light" size="sm" onClick={() => onNavigate('NEXT')}><HiChevronRight /></Button>
        </ButtonGroup>
        <span className="fw-bold fs-5" style={{ minWidth: '150px', textAlign: 'center' }}>
            {getLabel()}
        </span>
      </div>

      {/* Right: View Switcher */}
      <div className="d-flex gap-1">
        {(['year', 'month', 'day'] as ViewType[]).map(v => (
            <Button
                key={v}
                variant={view === v ? 'primary' : 'ghost'}
                size="sm"
                className={`text-capitalize ${view !== v ? 'text-muted' : ''}`}
                onClick={() => onViewChange(v)}
                style={{ minWidth: '60px' }}
            >
                {v}
            </Button>
        ))}
      </div>
    </div>
  );
};

export default CalendarToolbar;
