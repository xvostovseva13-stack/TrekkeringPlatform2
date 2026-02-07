import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Container } from 'react-bootstrap';
import GlobalNoteButton from '../components/widgets/GlobalNoteButton';
import { useToolbarActions } from '../context/ToolbarActionContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { onNoteClick } = useToolbarActions();

  const handleNoteClick = () => {
    if (onNoteClick) {
      onNoteClick();
    } else {
      // Default Global Action (To be implemented)
      console.log('Global Note Clicked (No context)');
      alert('Global Note creation is not yet implemented. Go to Calendar or Notes page.');
    }
  };

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar Area */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 min-w-0">
        <Topbar />
        
        {/* Global Toolbar Zone */}
        <div id="app-toolbar" className="bg-white border-bottom d-flex align-items-center" style={{ minHeight: '50px' }}>
            <GlobalNoteButton onClick={handleNoteClick} />
        </div>

        <main className="flex-grow-1 overflow-auto bg-app-bg p-4">
          <Container fluid className="h-100 p-0">
             {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
