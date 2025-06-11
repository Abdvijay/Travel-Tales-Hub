import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.js";
import Auth from "./pages/Auth.js";
import ForgotPassword from "./pages/ForgetPassword.js";
import Home from "./pages/Home.js";
import Profile from "./pages/Profile.js";
import AdminDashboard from "./pages/AdminDashboard.js";

// ✅ Check authentication
const isAuthenticated = () => !!localStorage.getItem("token");

const App = () => {
    const navigate = useNavigate();
    const [auth, setAuth] = useState(isAuthenticated());

    // ✅ Redirect to login if not authenticated
    useEffect(() => {
        if (!auth) {
            navigate("/auth");
        }
    }, [auth, navigate]);

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth setAuth={setAuth} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ✅ Protected Home Route */}
            <Route path="/home" element={auth ? <Home /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={auth ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
    );
};

export default App;