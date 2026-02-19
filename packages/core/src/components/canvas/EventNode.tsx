import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from 'react-bootstrap';
import { HiOutlineCalendarDays, HiOutlineClock } from 'react-icons/hi2';
import dayjs from 'dayjs';

const EventNode = ({ data }: NodeProps) => {
  const { label, color, start, end, allDay, onEdit, id } = data;
  
  // Format date/time display
  const startDate = dayjs(start as string);
  const endDate = dayjs(end as string);
  const isSameDay = startDate.isSame(endDate, 'day');
  
  const timeString = allDay 
    ? 'All Day' 
    : `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;

  const dateString = isSameDay 
    ? startDate.format('D MMM YYYY') 
    : `${startDate.format('D MMM')} - ${endDate.format('D MMM')}`;

  const handleDoubleClick = () => {
    if (onEdit && typeof onEdit === 'function') {
        onEdit(id); // Pass widget ID (or dataSourceId if available in parent logic)
    }
  };

  return (
    <Card 
      style={{ width: '220px', backgroundColor: (color as string) || '#6366f1', color: 'white', cursor: 'pointer' }} 
      className="shadow-sm border-0"
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles for connecting */}
      <Handle type="target" position={Position.Top} id="t-t" className="w-16 !bg-white" />
      <Handle type="source" position={Position.Top} id="t-s" className="w-16 !bg-white" style={{ zIndex: 1 }} />
      <Handle type="target" position={Position.Bottom} id="b-t" className="w-16 !bg-white" />
      <Handle type="source" position={Position.Bottom} id="b-s" className="w-16 !bg-white" style={{ zIndex: 1 }} />
      <Handle type="target" position={Position.Left} id="l-t" className="w-16 !bg-white" />
      <Handle type="source" position={Position.Left} id="l-s" className="w-16 !bg-white" style={{ zIndex: 1 }} />
      <Handle type="target" position={Position.Right} id="r-t" className="w-16 !bg-white" />
      <Handle type="source" position={Position.Right} id="r-s" className="w-16 !bg-white" style={{ zIndex: 1 }} />

      <Card.Body className="p-2">
        <div className="d-flex align-items-center gap-2 mb-2 border-bottom border-white border-opacity-25 pb-2">
            <HiOutlineCalendarDays size={18} />
            <span className="fw-bold text-truncate">{label as string}</span>
        </div>
        <div className="small opacity-90">
            <div className="fw-bold">{dateString}</div>
            <div className="d-flex align-items-center gap-1 mt-1 opacity-75" style={{ fontSize: '0.75rem' }}>
                <HiOutlineClock size={12}/> {timeString}
            </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default memo(EventNode);
