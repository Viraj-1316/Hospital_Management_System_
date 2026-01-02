import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("fill all the details");
      return;
    }

    // Connection with server
    axios
      .post(`${API_BASE}/Login`, { email, password })
      .then((res) => {
        if (res.data.status === "Success") {
          const user = res.data.user;


          localStorage.setItem("user", JSON.stringify(user));

          //   role logic using if else 
          if (user.role === "admin") {
            navigate("/admin-dashboard");
          } else if (user.role === "doctor") {
            navigate("/doctor-dashboard");
          } else {
            navigate("/user-dashboard");
          }
        } else if (res.data === "Wrong Passwordd") {
          setMessage("Incorrect password");
        } else if (res.data === "No record exist") {
          setMessage("No account ");
        } else {
          setMessage(res.data || "error from server");
        }
      })
      .catch((err) => {
        console.error("Login failed:", err);
        setMessage("Server error");
      });
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "380px" }}>
        <h3 className="text-center mb-3">Welcome Back</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleSubmit}>
          {/* email code */}
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* password code */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-2">
            Log In
          </button>

          <p className="text-center mt-3 mb-0">
            Don’t have an account?{" "}
            <a href="/Signup" className="text-decoration-none">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
