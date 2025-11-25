import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import "../styles/services.css";

export default function EncounterTemplateList({ sidebarCollapsed, toggleSidebar }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  // Mock data for now
  const [templates, setTemplates] = useState([]);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName("");
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    // User said: "when tap on add it goes to another page i will tell you that later"
    // For now, we'll just close the modal and maybe log it.
    console.log("Add template clicked:", templateName);
    handleCloseModal();
    // In future: navigate to the next page
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div
        className="flex-grow-1 main-content-transition"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "250px",
          minHeight: "100vh",
          background: "#f5f6fa",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <div className="container-fluid mt-3">
          {/* Blue Header Bar */}
          <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0">Encounter Template List</h5>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
                onClick={() => window.history.back()}
              >
                Back
              </button>
              <button
                className="btn btn-light btn-sm d-flex align-items-center gap-2"
                onClick={handleAddClick}
              >
                <FaPlus /> Add Encounter Template
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white shadow-sm rounded p-3 mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search encounter Template data by id, name"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-sm rounded p-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: "50px" }}>
                      <input type="checkbox" />
                    </th>
                    <th scope="col">ID</th>
                    <th scope="col">Template Name</th>
                    <th scope="col" className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Filter Row */}
                  <tr>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="ID"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Filter Template Name"
                      />
                    </td>
                    <td></td>
                  </tr>

                  {/* Data Rows */}
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    templates.map((t, index) => (
                      <tr key={index}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{index + 1}</td>
                        <td>{t.name}</td>
                        <td className="text-end">
                          {/* Actions would go here */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Rows per page:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "70px" }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">
                  Page 1 of {Math.ceil(templates.length / 10) || 1}
                </span>
                <button className="btn btn-sm btn-outline-secondary" disabled>
                  Prev
                </button>
                <button className="btn btn-sm btn-outline-secondary" disabled>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title fw-bold text-primary">
                      Add Encounter Template
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseModal}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleSaveTemplate}>
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          Enter Encounter Template Name
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Template Name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4">
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
