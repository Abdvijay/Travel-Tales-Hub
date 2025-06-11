import React, { useState, useEffect } from "react";
import "../styles/TopBar.css";
import { useNavigate } from 'react-router-dom';

// NEWLY ADDED: Import for communication between components
import { EventEmitter } from 'events';

// NEWLY ADDED: Create a new event emitter for search
export const searchEmitter = new EventEmitter();

const TopBar = ({ }) => {
    const username = localStorage.getItem("username");
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();
    
    useEffect(() => {
        // Check if there's no 'token' in localStorage
        if (!localStorage.getItem("token")) {
            // If not, redirect to the /auth (login) page
            navigate("/auth");
        }
    }, [navigate]);

    const handleLogout = () => {
        // Clear localStorage or sessionStorage
        // localStorage.removeItem("username");
        // localStorage.removeItem("token");

        // Redirect to the /auth page
        navigate("/auth", { replace: true });
        // window.location.reload();
    };

    // NEWLY ADDED: Handle search button click
    const handleSearch = () => {
        // Emit search event with query
        searchEmitter.emit('search', searchQuery);
    };

    // NEWLY ADDED: Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="topbar">
            {/* Left: Project Title */}
            <div className="topbar-left">
                <h2 className="project-title">Travel Tales Hub</h2>
            </div>

            {/* Center: Search Bar + Button + Filter */}
            <div className="topbar-center">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search trips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress} 
                />
                <button className="search-btn" onClick={handleSearch}>{/* NEWLY MODIFIED */}
                    Search
                </button>

                {/* <div className="filter-section">
                    <label>
                        <input type="checkbox" defaultChecked /> Show Popular
                    </label>
                </div> */}
            </div>

            {/* Right: Username & Logout Button */}
            <div className="topbar-right">
                <div className="user-info">
                    <span className="user-greeting">Welcome,</span>
                    <span className="user-name">{username ? username : "Guest"}</span>
                </div>

                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

export default TopBar;