import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar.js";
import TopBar from "../components/TopBar.js";
import "../styles/Home.css";
import Profile from "./Profile.js";
import CreateTripPage from "./CreateTripPage.js";
import MorePage from "../components/MorePage.js";
import NotificationPage from "./NotificationPage.js";
import NewsFeed from "../components/Newsfeed.js";

const Home = () => {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState("Newsfeed"); // ✅ Controls right-side content

    // ✅ Logout Function
    const handleLogout = () => {
        localStorage.removeItem("token"); // Remove token
        alert("You have been logged out."); // Show alert
        navigate("/auth"); // Redirect to login page
    };

    return (
        <div className="home-container">
            <TopBar onLogout={handleLogout} /> {/* ✅ Full top bar */}
            <div className="main-section">
                <Sidebar setActivePage={setActivePage} /> {/* ✅ Left Main Bar */}
                <div className="content-area">
                    {/* ✅ Right Main Content Bar */}
                    {activePage === "Newsfeed" && <NewsFeed />
                    // (
                    //     <>
                    //         <div className="welcome-container">
                    //             <h2>Welcome to Travel Tales Hub!</h2>
                    //             <p>Newsfeed will be displayed here...</p>
                    //         </div>
                    //     </>
                    // )
                    }
                    {activePage === "Create" && <CreateTripPage />}
                    {activePage === "Notifications" && <NotificationPage />}
                    {activePage === "Profile" && <Profile />}
                    {/* {activePage === "Messages" && <h2>Messages Section</h2>} */}
                    {activePage === "More" && <MorePage />}
                </div>
            </div>
        </div>
    );
};

export default Home;