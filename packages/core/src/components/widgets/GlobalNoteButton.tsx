import { Button } from 'react-bootstrap';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import { DraggableWidgetIcon } from '../dnd/DraggableWidgetIcon';

interface GlobalNoteButtonProps {
  label?: string;
}

const GlobalNoteButton = ({ label = 'Note' }: GlobalNoteButtonProps) => {
  return (
    <DraggableWidgetIcon type="note" data={{ color: '#fff9c4' }}>
      <div className="d-flex align-items-center h-100 px-3">
        <Button 
            variant="ghost" 
            className="d-flex flex-column align-items-center justify-content-center border-0 text-muted p-1 hover-bg-light"
            style={{ width: '60px', height: '100%' }}
        >
          <HiOutlineDocumentText size={24} className="mb-1" />
          <span style={{ fontSize: '0.7rem' }}>{label}</span>
        </Button>
      </div>
    </DraggableWidgetIcon>
  );
};

export default GlobalNoteButton;
