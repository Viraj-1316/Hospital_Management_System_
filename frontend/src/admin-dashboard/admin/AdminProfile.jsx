import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import API_BASE from "../../config";

function AdminProfile() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userId = authUser?.id;
  const userRole = authUser?.role;

  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    phone: "",
    gender: "",
    dob: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      toast.error("User not found");
      setLoading(false);
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use admin endpoint if role is admin or clinic_admin
      const role = userRole?.toLowerCase();
      const endpoint = (role === 'admin' || role === 'clinic_admin') ? `${API_BASE}/api/admin/${userId}` : `${API_BASE}/api/user/${userId}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setForm({
        name: data.name || "",
        email: data.email || "",
        avatar: data.avatar || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dob: data.dob || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        postalCode: data.postalCode || "",
      });
      setAvatarPreview(data.avatar || "");
      setLoading(false);
    } catch {
      toast.error("Error loading profile");
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, avatar: reader.result });
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      // Use admin endpoint if role is admin or clinic_admin
      const role = userRole?.toLowerCase();
      const endpoint = (role === 'admin' || role === 'clinic_admin') ? `${API_BASE}/api/admin/${userId}` : `${API_BASE}/api/user/${userId}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to update profile");
        setSaving(false);
        return;
      }

      const updated = await res.json();

      const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
      stored.name = updated.name;
      localStorage.setItem("authUser", JSON.stringify(stored));

      toast.success("Profile updated");
      setSaving(false);
    } catch {
      toast.error("Error updating");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #eef2ff, #fafafe)",
        }}
        className="d-flex justify-content-center align-items-center"
      >
        Loading...
      </div>
    );
  }

  const letter = form.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #eef2ff, #fafafe)",
        paddingTop: "24px",
        paddingBottom: "24px",
      }}
    >
      <div className="container" style={{ maxWidth: "1100px" }}>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2 mb-3"
          onClick={() => navigate("/admin-dashboard")}
        >
          <span style={{ fontSize: "18px" }}>←</span>
          <span className="small">Back to dashboard</span>
        </button>

        <div
          className="rounded-4 mb-4"
          style={{
            background:
              "linear-gradient(135deg, #2c7be5, #6f42c1, #20c997)",
            padding: "18px 22px",
            color: "#fff",
          }}
        >
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 600,
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    alt="avatar"
                  />
                ) : (
                  letter
                )}
              </div>

              <div>
                <h4 className="mb-1 fw-semibold">
                  {form.name || "Admin"}
                </h4>
                <div className="small opacity-75">
                  Administrator · OneCare
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <span
                className="badge rounded-pill px-3 py-2"
                style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
              >
                Profile
              </span>
              <span
                className="badge rounded-pill px-3 py-2"
                style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
              >
                Updated now
              </span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4 text-center">
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "32px",
                    overflow: "hidden",
                    margin: "0 auto",
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt="Profile"
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "50px",
                        fontWeight: 600,
                        color: "#666",
                      }}
                    >
                      {letter}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="form-control mt-3"
                  onChange={handleAvatar}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h5 className="mb-3 fw-semibold">Profile details</h5>

                <form onSubmit={updateProfile} className="row g-3">
                  <div className="col-md-6">
                    <label className="small mb-1">Full name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">Email</label>
                    <input
                      value={form.email}
                      className="form-control"
                      disabled
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">Phone</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="small mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="small mb-1">Date of birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-12 mt-3">
                    <h6 className="fw-semibold">Address</h6>
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">Address line 1</label>
                    <input
                      name="addressLine1"
                      value={form.addressLine1}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">Address line 2</label>
                    <input
                      name="addressLine2"
                      value={form.addressLine2}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="small mb-1">Postal code</label>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="col-12 d-flex justify-content-end">
                    <button
                      className="btn btn-primary px-4"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
