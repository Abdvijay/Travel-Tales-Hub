import React from "react";
import "../styles/SideBar.css";

const Sidebar = ({ activePage, setActivePage }) => {
    return (
        <div className="sidebar">
            <ul>
                <li 
                    className={activePage === "Newsfeed" ? "active" : ""} 
                    onClick={() => setActivePage("Newsfeed")}
                >
                    📢 Home
                </li>
                <li 
                    className={activePage === "Create" ? "active" : ""} 
                    onClick={() => setActivePage("Create")}
                >
                    ✍️ Create
                </li>
                {/* <li 
                    className={activePage === "Messages" ? "active" : ""} 
                    onClick={() => setActivePage("Messages")}
                >
                    💬 Messages
                </li> */}
                <li 
                    className={activePage === "Notifications" ? "active" : ""} 
                    onClick={() => setActivePage("Notifications")}
                >
                    🔔 Notifications
                </li>
                <li 
                    className={activePage === "Profile" ? "active" : ""} 
                    onClick={() => setActivePage("Profile")}
                >
                    👤 Profile
                </li>
                <li 
                    className={activePage === "More" ? "active" : ""} 
                    onClick={() => setActivePage("More")}
                >
                    ⚙️ More
                </li>
            </ul>   
        </div>
    );
};

export default Sidebar;