import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import SettingsSidebar from './SettingsSidebar';

const SettingLayout = () => {
  return (
    <DoctorLayout>
      <div className="container-fluid p-0">
        {/* Responsive Flex Container:
            - Mobile: flex-column (Sidebar on top, Content below)
            - Desktop (md+): flex-row (Sidebar left, Content right)
        */}
        <div className="d-flex flex-column flex-md-row gap-3 gap-md-4 p-3 p-md-4">
          
          {/* Sidebar Wrapper */}
          <div className="settings-sidebar-wrapper">
            <SettingsSidebar />
          </div>

          {/* Content Area */}
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="bg-white rounded shadow-sm p-3 p-md-4" style={{ minHeight: '80vh' }}>
              <Outlet />
            </div>
          </div>

        </div>
      </div>

      {/* Custom CSS for the Sidebar Width:
          - Mobile: 100% width (full width block)
          - Desktop: Fixed 260px width
      */}
      <style>{`
        .settings-sidebar-wrapper {
          width: 100%;
        }
        @media (min-width: 768px) {
          .settings-sidebar-wrapper {
            width: 260px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </DoctorLayout>
  );
};

export default SettingLayout;