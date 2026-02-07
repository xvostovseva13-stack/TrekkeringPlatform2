import { Button } from 'react-bootstrap';
import { HiCursorClick, HiHand } from 'react-icons/hi';

export type CanvasTool = 'cursor' | 'hand';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
}

const CanvasToolbar = ({ activeTool, onToolChange }: CanvasToolbarProps) => {
  return (
    <div 
      className="position-absolute d-flex flex-column gap-1 bg-white shadow-sm rounded-3 p-1"
      style={{ 
        right: '20px', // Moved to Right
        top: '50%', 
        transform: 'translateY(-50%)', 
        zIndex: 5,
        border: '1px solid #e2e8f0'
      }}
    >
      <Button
        variant={activeTool === 'cursor' ? 'primary' : 'light'}
        size="sm"
        className="d-flex align-items-center justify-content-center p-0 border-0"
        onClick={() => onToolChange('cursor')}
        title="Select (Cursor)"
        style={{ width: '32px', height: '32px' }} // Smaller size
      >
        <HiCursorClick size={16} />
      </Button>

      <Button
        variant={activeTool === 'hand' ? 'primary' : 'light'}
        size="sm"
        className="d-flex align-items-center justify-content-center p-0 border-0"
        onClick={() => onToolChange('hand')}
        title="Pan (Hand)"
        style={{ width: '32px', height: '32px' }} // Smaller size
      >
        <HiHand size={16} />
      </Button>
    </div>
  );
};

export default CanvasToolbar;
