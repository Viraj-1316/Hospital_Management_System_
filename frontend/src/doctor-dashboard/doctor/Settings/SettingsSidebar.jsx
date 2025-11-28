import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaList, FaVideo } from 'react-icons/fa';

const SettingsSidebar = () => {
  const sidebarItems = [
    { name: 'Holidays', path: '/doctor/settings/holidays', icon: <FaHome /> },
    { name: 'Doctor Sessions', path: '/doctor/settings/sessions', icon: <FaCalendarAlt /> },
    { name: 'Listings', path: '/doctor/settings/listings', icon: <FaList /> },
    { name: 'Google Meet Integration', path: '/doctor/settings/integration', icon: <FaVideo /> },
  ];

  return (
    <div className="bg-white rounded shadow-sm overflow-hidden">
      <div className="list-group list-group-flush">
        {sidebarItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.path === '/doctor/settings'} // Prevents partial match issues
            className={({ isActive }) =>
              `list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 border-0 ${
                isActive ? 'text-white bg-primary' : 'text-secondary'
              }`
            }
            style={({ isActive }) => ({
               fontWeight: isActive ? '600' : '400',
               transition: 'all 0.2s'
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