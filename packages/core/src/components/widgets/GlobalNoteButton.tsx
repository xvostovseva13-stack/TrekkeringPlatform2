import { Button } from 'react-bootstrap';
import { HiOutlineDocumentText } from 'react-icons/hi2';

interface GlobalNoteButtonProps {
  onClick?: () => void;
  label?: string;
}

const GlobalNoteButton = ({ onClick, label = 'Note' }: GlobalNoteButtonProps) => {
  return (
    <div className="d-flex align-items-center h-100 px-3">
      <Button 
          variant="ghost" 
          className="d-flex flex-column align-items-center justify-content-center border-0 text-muted p-1 hover-bg-light"
          style={{ width: '60px', height: '100%' }}
          onClick={onClick}
      >
        <HiOutlineDocumentText size={24} className="mb-1" />
        <span style={{ fontSize: '0.7rem' }}>{label}</span>
      </Button>
    </div>
  );
};

export default GlobalNoteButton;
