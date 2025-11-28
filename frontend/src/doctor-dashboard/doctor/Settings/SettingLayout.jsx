import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import SettingsSidebar from './SettingsSidebar';

const SettingLayout = () => {
  return (
    <DoctorLayout>
      <div className="container-fluid p-0">
        <div className="d-flex gap-4 p-4">
          
          <div style={{ width: '260px', flexShrink: 0 }}>
            <SettingsSidebar />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bg-white rounded shadow-sm p-4" style={{ minHeight: '80vh' }}>
              <Outlet />
            </div>
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
};

export default SettingLayout;