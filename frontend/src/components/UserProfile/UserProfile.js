import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./UserProfile.css";

const UserProfile = () => {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/profile?username=${username}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setProfile(response.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading || !profile) return <p>Loading...</p>;

    return (
        <div className="user-profile">
            <div className="profile-header">
                <div className="profile-left">
                    <img src="/default-profile.png" alt="Profile" className="profile-pic" />
                </div>
                <div className="profile-right">
                    <h2>{profile.username}</h2>
                    <p>Posts: {profile.post_count}</p>
                    <p>Followers: {profile.followers_count}</p>
                    <p>Following: {profile.following_count}</p>
                    <button className="edit-profile-btn">Edit Profile</button>
                </div>
            </div>

            <div className="profile-content" style={{ padding: "1rem" }}>
                <hr style={{ margin: "1.5rem 0" }} />
                <h3 style={{ textAlign: "center", fontWeight: "bold" }}>User Trips</h3>
                <p style={{ textAlign: "center", color: "#777", marginTop: "1rem", fontSize: "16px" }}>
                    No posts yet
                </p>
            </div>
        </div>
    );
};

export default UserProfile;