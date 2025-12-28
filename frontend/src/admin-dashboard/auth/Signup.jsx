import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";

// variable to save data 
const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // check does data is there
    if (!name || !email || !password) {
      setMessage("Please fill in all fields!");
      return;
    }

    // data server la send hoto 
    axios
      .post(`${API_BASE}/signup`, { name, email, password })
      .then((result) => {
        setMessage("Signup successful!");
        setName("");
        setEmail("");
        setPassword("");
        navigate('/Login')
      })
      .catch((err) => {
        console.error("Signup failed:", err);
        setMessage("Error during signup. Please try again.");
      });
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "380px" }}>
        <h3 className="text-center mb-3">Create Account</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Create a password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-2">
            Sign Up
          </button>

          <p className="text-center mt-3 mb-0">
            Already have an account?{" "}
            <a href="/login" className="text-decoration-none">
              Log In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
