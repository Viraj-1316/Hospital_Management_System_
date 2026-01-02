import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "../../admin-dashboard/styles/admin-shared.css";
import API_BASE from "../../config";

export default function SharedEncounterTemplateList({ role }) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/encounter-templates`);
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
      toast.error("Failed to load templates");
    }
  };

  const handleAddClick = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setIsModalOpen(true);
  };

  const handleEditClick = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName("");
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        // Update existing template
        await axios.put(
          `${API_BASE}/encounter-templates/${editingTemplate._id}`,
          { name: templateName }
        );
        toast.success("Template updated successfully");
        handleCloseModal();
        fetchTemplates();
      } else {
        // Create new template
        const res = await axios.post(`${API_BASE}/encounter-templates`, {
          name: templateName,
        });
        toast.success("Template created successfully");
        handleCloseModal();
        // Redirect to details page to edit the rest
        if (role === "doctor") {
          navigate(`/doctor/encounter-template-details/${res.data._id}`);
        } else {
          navigate(`/encounter-template-details/${res.data._id}`);
        }
      }
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Failed to save template");
    }
  };

// ADD THESE NEW FUNCTIONS
const handleDeleteClick = (id) => {
  setTemplateToDelete(id);
  setShowDeleteModal(true);
};

const confirmDelete = async () => {
  if (templateToDelete) {
    try {
      await axios.delete(`${API_BASE}/encounter-templates/${templateToDelete}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("Failed to delete template");
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  }
};

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid mt-3">
      {/* Blue Header Bar */}
      <div className="services-topbar services-card d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-white mb-0">Encounter Template List</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
            onClick={() => navigate(-1)}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                <th scope="col" style={{ width: "100px" }}>
                  ID
                </th>
                <th scope="col">Template Name</th>
                <th
                  scope="col"
                  className="text-center"
                  style={{ width: "100px" }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Filter Row */}
              <tr className="d-none d-md-table-row">
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
                    className="form-control form-control-sm w-100"
                    placeholder="Filter Template Name"
                  />
                </td>
                <td></td>
              </tr>

              {/* Data Rows */}
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    No Data Found
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((t, index) => (
                  <tr key={t._id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td data-label="ID">{index + 1}</td>
                    <td data-label="Template Name">{t.name}</td>
                    <td data-label="Action">
                      <div className="d-flex gap-2 justify-content-">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditClick(t)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm template-action-btn btn-outline-info"
                          title="View"
                          onClick={() => {
                            if (role === "doctor") {
                              navigate(
                                `/doctor/encounter-template-details/${t._id}`
                              );
                            } else {
                              navigate(`/encounter-template-details/${t._id}`);
                            }
                          }}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm template-action-btn btn-outline-danger"
                          onClick={() => handleDeleteClick(t._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
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
              Page 1 of {Math.ceil(filteredTemplates.length / 10) || 1}
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

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-primary">
                    {editingTemplate
                      ? "Edit Encounter Template"
                      : "Add Encounter Template"}
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
                        {editingTemplate ? "Update" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {
    /* --- CUSTOM DELETE MODAL --- */
  }
  {
    showDeleteModal && (
      <>
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1040 }}
        ></div>
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-body p-4">
                <h5
                  className="mb-2 text-dark fw-bold"
                  style={{ fontSize: "1.1rem" }}
                >
                  Are you sure?
                </h5>
                <p
                  className="text-secondary mb-4"
                  style={{ fontSize: "0.9rem" }}
                >
                  Press yes to delete this template.
                </p>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-danger btn-sm px-3 fw-bold"
                    onClick={confirmDelete}
                  >
                    YES
                  </button>
                  <button
                    className="btn btn-light btn-sm px-3 fw-bold border"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
    </div>
  );
}
