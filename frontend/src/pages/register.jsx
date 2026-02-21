import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
 
const Register = () => {
 
  const navigate = useNavigate();
 
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Citizen",
    location: "",
    idFile: null
  });
 
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
 
  // Detect Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          location: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
        });
        setError("");
      },
      () => {
        setError("Unable to fetch location");
      }
    );
  };
 
  const handleChange = (e) => {
    if (e.target.name === "idFile") {
      setForm({ ...form, idFile: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
 
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
 
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", form.role);
      formData.append("location", form.location);

      if (form.idFile) {
        formData.append("idFile", form.idFile);
      }

      await API.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
 
      setMessage("Registration Successful! Redirecting to login...");
 
      setTimeout(() => {
        navigate("/");
      }, 2000);
 
    } catch (err) {
      console.log(err.response?.data);
      setError(
        err.response?.data?.message ||
        "Registration Failed. Please try again."
      );
    }
  };
 
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 gradient-bg">
      <div className="card p-4 shadow-lg rounded-4" style={{ width: "420px" }}>
        <h3 className="text-center mb-3">Create Account</h3>
 
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
 
        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}
 
        <form onSubmit={handleSubmit}>
 
          <input
            type="text"
            name="name"
            className="form-control mb-2"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />
 
          <input
            type="email"
            name="email"
            className="form-control mb-2"
            placeholder="Email"
            onChange={handleChange}
            required
          />
 
          <input
            type="password"
            name="password"
            className="form-control mb-2"
            placeholder="Password"
            onChange={handleChange}
            required
          />
 
          <input
            type="password"
            name="confirmPassword"
            className="form-control mb-2"
            placeholder="Confirm Password"
            onChange={handleChange}
            required
          />
 
          <select
            name="role"
            className="form-select mb-2"
            onChange={handleChange}
          >
            <option value="Citizen">Citizen</option>
            <option value="Government Official">Government Official</option>
          </select>
 
          <div className="d-grid mb-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={detectLocation}
            >
              Detect Location
            </button>
          </div>
 
          <input
            type="text"
            name="location"
            className="form-control mb-2"
            placeholder="Location"
            value={form.location}
            readOnly
          />
 
          <input
            type="file"
            name="idFile"
            className="form-control mb-3"
            onChange={handleChange}
          />
 
          <button className="btn btn-primary w-100">
            Register
          </button>
        </form>
 
        <p className="text-center mt-3 mb-0">
          Already registered?{" "}
          <Link to="/" className="fw-semibold text-primary text-decoration-none">
            Login
          </Link>
        </p>
 
      </div>
    </div>
  );
};
 
export default Register;
 
