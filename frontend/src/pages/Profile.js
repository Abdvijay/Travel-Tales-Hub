import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Profile.css";
import ProfilePostCard from '../components/ProfilePostCard.js';

const Profile = () => {
  const [user, setUser] = useState({
    profile_pic: "",
    username: localStorage.getItem("username"),
    followers_count: 0,
    following_count: 0,
    post_count: 0,
    bio: "Traveler exploring the world!"
  });

  const [newBio, setNewBio] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [showFullTripDialog, setShowFullTripDialog] = useState(false);
  const [isProfilePostDialogOpen, setIsProfilePostDialogOpen] = useState(false);
  const [selectedTripData, setSelectedTripData] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get("http://localhost:5000/users/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);

        if (!response.data.bio || response.data.bio.trim() === "") {
          setNewBio("Traveler exploring the world!");
        } else {
          setNewBio(response.data.bio);
        }

        const postsResponse = await axios.get("http://localhost:5000/users/user-posts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsResponse.data);
        console.log(postsResponse.data);

      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("bio", newBio.trim());
    if (selectedFile) {
      formData.append("profile_pic", selectedFile);
    }

    try {
      const response = await axios.put("http://localhost:5000/users/profile/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update profile instantly in UI
      setUser((prev) => ({
        ...prev,
        bio: response.data.bio,
        profile_pic: `${response.data.profile_pic}?t=${new Date().getTime()}`,
      }));

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update profile.");
      console.error("Update error:", error);
    }
  };

  // Called when "Show Full Trip" button is clicked
  const handleShowFullTrip = async (postId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/posts/get_trips_by_post/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (Array.isArray(response.data)) {
        setSelectedTripData(response.data); // Update tripData state
        setShowFullTripDialog(true); // Now open dialog after data fetched
      } else {
        console.error("Error fetching trips:", response.data || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error.response?.data || error.message || "Unknown error");
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  // Called to close dialog
  const handleCloseFullTripDialog = () => {
    setShowFullTripDialog(false);
    setSelectedTripData(null);
  };

  const handleEditPost = (post) => {
    // You can implement opening an edit form or dialog
    console.log("Edit post:", post);
    // For example:
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handleCloseProfilePostDialog = () => {
    setSelectedPost(null);
    setIsProfilePostDialogOpen(false);
  };

  const handleShowProfilePostDialog = (post) => {
    setSelectedPost(post);
    setIsProfilePostDialogOpen(true);
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (confirmed) {
      try {
        const response = await fetch(`http://localhost:5000/delete_post/${postId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          alert("Post deleted successfully.");
          // Remove the post from local state if needed
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        } else {
          alert("Failed to delete post.");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };


  // Extract first letter of username for placeholder
  const firstLetter = user.username ? user.username.charAt(0).toUpperCase() : "?";

  return (
    <div className="profile-page-custom">
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-left">
            {user.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="profile-pic" />
            ) : (
              <div className="profile-placeholder">{firstLetter}</div>
            )}
          </div>

          <div className="profile-right">
            <h2 className="profile-username">{user.username}</h2>
            <div className="profile-stats">
              <p><strong>{posts.length}</strong> Posts</p>
            </div>
            <h3>Bio</h3>
            <p
              className="profile-bio"
              dangerouslySetInnerHTML={{
                __html: user.bio && user.bio.trim() !== "" ? user.bio : "Traveler exploring the world!"
              }}
            ></p>
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <hr className="profile-divider" />

      {/* Post Section */}
      <div className="post-section">
        {posts.length === 0 ? (
          <div className="no-post-message">
            <svg className="no-post-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#777" viewBox="0 0 24 24">
              <path d="M20 4H4C2.897 4 2 4.897 2 6V18C2 19.103 2.897 20 4 20H20C21.103 20 22 19.103 22 18V6C22 4.897 21.103 4 20 4zM4 6H20L12 13L4 6zM4 18V8L12 15L20 8V18H4Z" />
            </svg>
            <span className="no-post-text">No post yet</span>
          </div>
        ) : (
          <div className="profile-post-grid">
            {posts.map((post, idx) => (
              <div key={idx} className="profile-post-card" onClick={() => handleShowProfilePostDialog(post)}>
                <img src={post.image_url} alt={`Post ${idx}`} className="post-card-img" />
                <div className="post-card-title">{post.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="profile-divider" />

      {/* Edit Profile Dialog */}
      {isEditing && (
        <div className="edit-profile-dialog">
          <div className="dialog-content">
            <h2>Edit Profile</h2>

            <label>Update Bio:</label>
            <textarea
              value={newBio}
              onChange={(e) => {
                const value = e.target.value;
                const words = value.trim().split(/\s+/);
                const lines = value.split("\n");

                if (words.length <= 25 && lines.length <= 4) {
                  setNewBio(value);
                }
              }}
              placeholder="Enter your bio..."
              rows={4}
              style={{
                width: "100%",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: "10px",
                fontSize: "14px",
                resize: "none",
                height: "100px",
                lineHeight: "1.5em",
              }}
            ></textarea>

            <p style={{ marginTop: 4, fontSize: "12px", color: "#555" }}>
              Word Count: {newBio.trim().split(/\s+/).filter(Boolean).length}/25
            </p>

            <label>Update Profile Picture:</label>
            <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />

            <button
              className="save-btn"
              onClick={handleUpdateProfile}
              disabled={
                newBio.trim().split(/\s+/).length > 25 || newBio.split("\n").length > 4
              }
              title={
                newBio.split("\n").length > 4
                  ? "Bio must not exceed 4 lines"
                  : newBio.trim().split(/\s+/).length > 25
                    ? "Bio must be 25 words or less"
                    : ""
              }
              style={{
                cursor:
                  newBio.trim().split(/\s+/).length > 25 || newBio.split("\n").length > 4
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  newBio.trim().split(/\s+/).length > 25 || newBio.split("\n").length > 4
                    ? 0.6
                    : 1,
              }}
            >
              Save Changes
            </button>
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
      {isProfilePostDialogOpen && selectedPost && (
        <ProfilePostCard
          post={selectedPost}
          // currentUserId={currentUserId}
          onClose={handleCloseProfilePostDialog}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onShowFullTrip={handleShowFullTrip}
        />
      )}

      {showFullTripDialog && selectedTripData && (
        <FullTripDialog
          onClose={handleCloseFullTripDialog}
          trips={[selectedTripData]} // Pass actual full trip data
        />
      )}
    </div>
  );

};

export default Profile;