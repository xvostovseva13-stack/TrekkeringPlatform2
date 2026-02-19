import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Card } from 'react-bootstrap';
import CanvasPage from './pages/CanvasPage';
import NotesPage from './pages/NotesPage';
import CalendarPage from './pages/CalendarPage';
import HabitsPage from './pages/HabitsPage';
import { useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DragOverlayWrapper } from './components/dnd/DragOverlayWrapper';

// Placeholder Pages (will be moved to separate files later)
const Dashboard = () => <Card className="p-4 shadow-sm border-0"><h1>Dashboard</h1><p className="text-muted">Welcome to your Trekker Platform.</p></Card>;
const Finances = () => <Card className="p-4 shadow-sm border-0"><h1>Finances</h1></Card>;
const Goals = () => <Card className="p-4 shadow-sm border-0"><h1>Goals</h1></Card>;

function App() {
  // Global prevention of "Auto-scroll" on middle-click
  useEffect(() => {
    const handleMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) { 
        e.preventDefault();
      }
    };

    window.addEventListener('mousedown', handleMiddleClick, { capture: true });
    
    return () => {
      window.removeEventListener('mousedown', handleMiddleClick, { capture: true });
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    
    // Dispatch a global event that pages can listen to
    // We pass the screen coordinates and the data
    const dropEvent = new CustomEvent('widget-drop', {
      detail: {
        type: active.data.current?.type,
        data: active.data.current,
        clientOffset: event.delta, // Movement delta
        finalPosition: { // Absolute screen coordinates of the drop
             x: event.active.rect.current.translated?.left ?? 0,
             y: event.active.rect.current.translated?.top ?? 0
        }
      }
    });
    
    window.dispatchEvent(dropEvent);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </MainLayout>
      <DragOverlayWrapper />
    </DndContext>
  );
}

export default App;