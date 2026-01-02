import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaList, FaVideo } from 'react-icons/fa';

const SettingsSidebar = () => {
  const sidebarItems = [
    { name: 'Holidays', path: '/doctor/settings/holidays', icon: <FaHome /> },
    { name: 'Doctor Sessions', path: '/doctor/settings/sessions', icon: <FaCalendarAlt /> },
    { name: 'Listings', path: '/doctor/settings/listings', icon: <FaList /> },
    { name: 'Google Meet', path: '/doctor/settings/integration', icon: <FaVideo /> },
  ];

  return (
    <div className="bg-white rounded shadow-sm">
      {/* Mobile: Horizontal Flex (flex-row) with scrolling
          Desktop: Vertical Flex (flex-md-column)
      */}
      <div className="list-group list-group-flush d-flex flex-row flex-md-column overflow-auto" 
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}> {/* Hides scrollbar in Firefox/IE */}
        
        {/* Hide Scrollbar for Webkit (Chrome/Safari) */}
        <style>{`
          .list-group::-webkit-scrollbar { display: none; }
        `}</style>

        {sidebarItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === '/doctor/settings'}
            className={({ isActive }) =>
              `list-group-item list-group-item-action d-flex align-items-center gap-2 p-3 border-0 ${
                isActive ? 'text-white bg-primary' : 'text-secondary'
              }`
            }
            style={({ isActive }) => ({
               fontWeight: isActive ? '600' : '400',
               transition: 'all 0.2s',
               whiteSpace: 'nowrap',     // Keeps text on one line
               minWidth: 'max-content'   // Ensures button fits text width
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default SettingsSidebar;