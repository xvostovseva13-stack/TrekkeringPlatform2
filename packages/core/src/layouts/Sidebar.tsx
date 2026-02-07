import { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { 
  HiOutlineHome,
  HiOutlineMap, 
  HiOutlineCalendar, 
  HiOutlineBookOpen, 
  HiOutlineCurrencyDollar, 
  HiOutlineTrophy, 
  HiOutlineCheckCircle,
  HiOutlineDocumentText
} from 'react-icons/hi2';
import clsx from 'clsx';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { to: "/", icon: HiOutlineHome, label: "Dashboard" },
    { to: "/canvas", icon: HiOutlineMap, label: "Canvas" },
    { to: "/notes", icon: HiOutlineDocumentText, label: "Notes" },
    { to: "/habits", icon: HiOutlineCheckCircle, label: "Habits" },
    { to: "/finances", icon: HiOutlineCurrencyDollar, label: "Finances" },
    { to: "/goals", icon: HiOutlineTrophy, label: "Goals" },
    { to: "/calendar", icon: HiOutlineCalendar, label: "Calendar" },
  ];

  return (
    <div 
      className="sidebar-wrapper position-relative h-100"
      style={{ width: '70px', flexShrink: 0 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div 
        className={clsx(
          "d-flex flex-column bg-white border-end h-100 shadow-sm transition-all",
          isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
        )}
        style={{ 
          width: isExpanded ? '240px' : '70px',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1050,
          overflowX: 'hidden'
        }}
      >
        <div className="d-flex align-items-center px-4" style={{ height: '60px', flexShrink: 0 }}>
           <span className={clsx("fw-bold text-primary fs-4 transition-opacity", !isExpanded && "opacity-0 invisible")}>Trekker</span>
           {!isExpanded && <span className="fw-bold text-primary fs-4 position-absolute" style={{ left: '24px' }}>T</span>}
        </div>

        <Nav className="flex-column flex-grow-1 px-2 gap-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                "sidebar-nav-link d-flex align-items-center rounded-3 p-2 text-dark text-decoration-none",
                isActive && "active"
              )}
            >
              <div className="d-flex align-items-center justify-content-center" style={{ width: '38px', flexShrink: 0 }}>
                <item.icon size={24} />
              </div>
              <span className={clsx(
                "ms-3 transition-opacity fw-medium",
                isExpanded ? "opacity-100" : "opacity-0 invisible"
              )}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </Nav>

        <div className="p-3 border-top text-center text-muted small" style={{ flexShrink: 0 }}>
          {isExpanded ? "Trekker v1.0.0" : "v1"}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
