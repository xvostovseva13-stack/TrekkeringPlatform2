import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Card } from 'react-bootstrap';
import CanvasPage from './pages/CanvasPage';
import NotesPage from './pages/NotesPage';
import CalendarPage from './pages/CalendarPage';
import { ToolbarActionProvider } from './context/ToolbarActionContext';

// Placeholder Pages (will be moved to separate files later)
const Dashboard = () => <Card className="p-4 shadow-sm border-0"><h1>Dashboard</h1><p className="text-muted">Welcome to your Trekker Platform.</p></Card>;
const Habits = () => <Card className="p-4 shadow-sm border-0"><h1>Habits</h1></Card>;
const Finances = () => <Card className="p-4 shadow-sm border-0"><h1>Finances</h1></Card>;
const Goals = () => <Card className="p-4 shadow-sm border-0"><h1>Goals</h1></Card>;

function App() {
  return (
    <ToolbarActionProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/finances" element={<Finances />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </MainLayout>
    </ToolbarActionProvider>
  );
}

export default App;