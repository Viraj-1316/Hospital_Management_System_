import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUserFriends,
  FaUserMd,
  FaStethoscope,
  FaFileInvoiceDollar,
  FaCog,
  FaClipboardList,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import "../styles/reception.css";

const ReceptionLayout = () => {
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);

  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const name = authUser?.name || "Receptionist";
  const avatar = authUser?.avatar || "";
  const initial = name ? name.charAt(0).toUpperCase() : "R";

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="rc-wrapper">
      {/* LEFT SIDEBAR */}
      <aside className="rc-sidebar">
        <div className="rc-sidebar-logo">
          <span className="rc-logo-text">OneCare</span>
        </div>

        <nav className="rc-menu">
          <NavLink
            end
            to="/reception"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaClipboardList />
            </span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/reception/appointments"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaCalendarAlt />
            </span>
            <span>Appointments</span>
          </NavLink>

          <NavLink
            to="/reception/encounters"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaClipboardList />
            </span>
            <span>Encounters</span>
          </NavLink>

          <NavLink
            to="/reception/patients"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaUserFriends />
            </span>
            <span>Patients</span>
          </NavLink>

          <NavLink
            to="/reception/doctors"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaUserMd />
            </span>
            <span>Services</span>
          </NavLink>

          <NavLink
            to="/reception/services"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaStethoscope />
            </span>
            <span>Clinic Services</span>
          </NavLink>

          <NavLink
            to="/reception/billing-records"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaFileInvoiceDollar />
            </span>
            <span>Billing records</span>
          </NavLink>

          <NavLink
            to="/reception/settings"
            className={({ isActive }) =>
              `rc-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="rc-menu-icon">
              <FaCog />
            </span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>

      {/* RIGHT SIDE */}
      <div className="rc-main">
        <header className="rc-topbar">
          <div className="rc-top-left">
            <button className="rc-menu-toggle">
              <span className="rc-burger-line" />
              <span className="rc-burger-line" />
              <span className="rc-burger-line" />
            </button>
            <div className="rc-top-title">
              <span className="rc-top-brand">One Care Reception</span>
            </div>
          </div>

          <div className="rc-top-right">
            <div
              className="rc-profile"
              onClick={() => setOpenProfile((v) => !v)}
            >
              <div
                className="rc-profile-avatar"
                style={{ overflow: "hidden" }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="rc-profile-text">
                <div className="rc-profile-name">{name}</div>
                <div className="rc-profile-role">Receptionist</div>
              </div>
            </div>

            {openProfile && (
              <div className="rc-profile-menu">
                <button onClick={() => navigate("/reception/my-profile")}>
                  My profile
                </button>
                <button
                  onClick={() => navigate("/reception/change-password")}
                >
                  Change password
                </button>
                <button className="rc-logout" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="rc-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ReceptionLayout;
