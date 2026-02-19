import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Container } from 'react-bootstrap';
import { ToolbarWidgetIcon } from '../components/widgets/ToolbarWidgetIcon';
import { HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineFire } from 'react-icons/hi2';
import { WidgetHistoryMenu } from '../components/dnd/WidgetHistoryMenu';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [menuState, setMenuState] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'note' | 'habit' | 'event';
  }>({ show: false, x: 0, y: 0, type: 'note' });

  const handleContextMenu = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    setMenuState({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: type as 'note' | 'habit' | 'event'
    });
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
            <ToolbarWidgetIcon 
                type="note" 
                label="Note" 
                icon={<HiOutlineDocumentText size={24}/>} 
                color="#fff9c4"
                onContextMenu={(e) => handleContextMenu(e, 'note')}
            />
            <ToolbarWidgetIcon 
                type="event" 
                label="Event" 
                icon={<HiOutlineCalendarDays size={24}/>} 
                color="#6366f1"
                onContextMenu={(e) => handleContextMenu(e, 'event')}
            />
            <ToolbarWidgetIcon 
                type="habit" 
                label="Habit" 
                icon={<HiOutlineFire size={24}/>} 
                color="#f97316"
                onContextMenu={(e) => handleContextMenu(e, 'habit')}
            />
        </div>

        <main className="flex-grow-1 overflow-hidden bg-app-bg p-3">
          <Container fluid className="h-100 p-0">
             {children}
          </Container>
        </main>
      </div>

      <WidgetHistoryMenu 
        show={menuState.show} 
        anchorPosition={{ x: menuState.x, y: menuState.y }} 
        type={menuState.type}
        onClose={() => setMenuState(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default MainLayout;
