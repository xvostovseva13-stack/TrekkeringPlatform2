import { Button } from 'react-bootstrap';
import { DraggableWidgetIcon } from '../dnd/DraggableWidgetIcon';
import { ReactNode } from 'react';

interface ToolbarWidgetIconProps {
  type: string;
  label: string;
  icon: ReactNode;
  color?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ToolbarWidgetIcon = ({ type, label, icon, color, onContextMenu }: ToolbarWidgetIconProps) => {
  return (
    <DraggableWidgetIcon type={type} data={{ color }}>
      <div 
        className="d-flex align-items-center h-100 px-3"
        onContextMenu={onContextMenu}
      >
        <Button 
            variant="ghost" 
            className="d-flex flex-column align-items-center justify-content-center border-0 text-muted p-1 hover-bg-light"
            style={{ width: '60px', height: '100%', cursor: 'grab' }}
        >
          <div className="mb-1">{icon}</div>
          <span style={{ fontSize: '0.7rem' }}>{label}</span>
        </Button>
      </div>
    </DraggableWidgetIcon>
  );
};
