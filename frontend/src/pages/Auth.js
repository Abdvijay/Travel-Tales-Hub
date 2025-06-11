import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Toggle between login and register forms
  const toggle = () => {
    setIsSignUp(!isSignUp);
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/user/register",
        {
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password,
        }
      );

      if (response.status === 201) {
        alert("Registration Successful!");
        alert(
          `Your PIN: ${response.data.pin_number}\nPlease save it for future logins.`
        );

        setIsSignUp(false); // Switch to login form
      }
    } catch (error) {
      setError(error.response?.data?.error || "Registration failed");
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/auth/user/login",
        {
          email: loginData.email,
          password: loginData.password,
        }
      );

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("userId", response.data.userId);
        alert("Login successful!");
        console.log(localStorage.getItem("userId"));
        if (
          loginData.email.toLowerCase() === "adminuser@gmail.com" &&
          loginData.password === "admin"
        ) {
          navigate("/admin-dashboard"); // Redirect for admin
        } else {
          navigate("/home"); // Redirect to regular Home
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div
      id="container"
      className={`container ${isSignUp ? "sign-up" : "sign-in"}`}
    >
      <div className="row">
        {/* SIGN UP FORM */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <div className="form sign-up">
              <h2>Sign Up</h2>
              {error && <p className="error">{error}</p>}
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <i className="bx bxs-user"></i>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bx bx-mail-send"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit">Sign up</button>
                <p>
                  <span>Already have an account?</span>
                  <b onClick={toggle} className="pointer">
                    Sign in here
                  </b>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* SIGN IN FORM */}
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="form sign-in">
              <h2>Sign In</h2>
              {error && <p className="error">{error}</p>}
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <i className="bx bxs-user"></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bx bxs-lock-alt"></i>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleLoginChange}
                    required
                  />
                </div>
                <button type="submit">Sign in</button>
                <p>
                  <b
                    className="pointer"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </b>
                </p>
                <p>
                  <span>Don't have an account?</span>
                  <b onClick={toggle} className="pointer">
                    Sign up here
                  </b>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="row content-row">
        <div class="col align-items-center flex-col">
          <div class="text sign-in">
            <h2>Welcome</h2>
          </div>
          <div class="img sign-in"></div>
        </div>
        <div class="col align-items-center flex-col">
          <div class="img sign-up"></div>
          <div class="text sign-up">
            <h2>Join with us</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
