import React, { useState, useEffect } from "react";
import axios from "axios";
import ProfilePostCard from "../components/ProfilePostCard.js";
import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isProfilePostDialogOpen, setIsProfilePostDialogOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);

  // New search states
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        return;
      }

      // Fetch all posts
      const postsResponse = await axios.get(
        "http://localhost:5000/users/admin/all-posts",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch dashboard stats
      const statsResponse = await axios.get(
        "http://localhost:5000/users/admin/dashboard-stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Posts Response:", postsResponse.data);
      console.log("Stats Response:", statsResponse.data);

      await fetchWeeklyActivity();

      setPosts(postsResponse.data || []);
      setTotalUsers(statsResponse.data?.totalUsers || 0);
      setTotalPosts(statsResponse.data?.totalPosts || 0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error response:", error.response?.data);

      // Set default values on error
      setPosts([]);
      setTotalUsers(0);
      setTotalPosts(0);
      setWeeklyActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:5000/users/admin/weekly-activity",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWeeklyActivity(response.data.weekly_data || []);
    } catch (error) {
      console.error("Error fetching weekly activity:", error);
      setWeeklyActivity([]);
    }
  };

  // Search functionality
  const handleSearch = (query) => {
    if (!query || query.trim() === "") {
      setIsSearchMode(false);
      setFilteredPosts([]);
      setSearchQuery("");
      return;
    }

    setSearchQuery(query);
    setIsSearchMode(true);

    const filtered = posts.filter(
      (post) =>
        post.title?.toLowerCase().includes(query.toLowerCase()) ||
        post.description?.toLowerCase().includes(query.toLowerCase()) ||
        post.username?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredPosts(filtered);
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setFilteredPosts([]);
    setSearchQuery("");
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
    //   localStorage.removeItem("token");
    //   localStorage.removeItem("userId");
      navigate("/auth", { replace: true });
    }
  };

  const handleShowProfilePostDialog = (post) => {
    setSelectedPost(post);
    setIsProfilePostDialogOpen(true);
  };

  const handleCloseProfilePostDialog = () => {
    setSelectedPost(null);
    setIsProfilePostDialogOpen(false);
  };

  // Get posts to display
  const postsToDisplay = isSearchMode ? filteredPosts : posts;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Admin Top Bar */}
      <div className="admin-top-bar">
        <div className="admin-top-bar-left">
          <h1 className="admin-project-title">Travel Tales Hub</h1>
        </div>

        <div className="admin-top-bar-center">
          <div className="admin-search-container">
            <input
              type="text"
              placeholder="Search posts, titles, descriptions, users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="admin-search-input"
            />
            <div className="admin-search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-top-bar-right">
          <span className="admin-welcome-text">Welcome, Admin</span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-dashboard">
        {/* Search Results Header */}
        {isSearchMode && (
          <div className="admin-search-results-header">
            <h3>Search Results for "{searchQuery}"</h3>
            {filteredPosts.length === 0 && (
              <p className="admin-no-search-results">
                No posts found matching your search.
              </p>
            )}
            <button className="admin-clear-search-btn" onClick={clearSearch}>
              Clear Search
            </button>
          </div>
        )}

        {/* Header Section - Only show when not in search mode */}
        {!isSearchMode && (
          <>
            <div className="admin-header">
              <h2>Admin Dashboard</h2>
              <p>Manage and monitor platform activities</p>
            </div>

            {/* Stats Section */}
            <div className="admin-stats-section">
              <div className="admin-stats-header">
                <h2>Platform Analytics</h2>
                <div className="admin-stats-summary">
                  <span className="admin-total-count">
                    {totalUsers + totalPosts}
                  </span>
                  <span className="admin-summary-label">Total Activity</span>
                </div>
              </div>

              <div className="admin-stats-instagram-grid">
                {/* Users Chart */}
                <div className="admin-instagram-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon admin-users-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                          fill="currentColor"
                        />
                        <path
                          d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <span className="admin-stat-label">Users</span>
                  </div>
                  <div className="admin-instagram-chart">
                    <div className="admin-chart-bars">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="admin-chart-bar">
                          <div
                            className="admin-bar-fill admin-users-bar"
                            style={{
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="admin-chart-value">
                      <span className="admin-main-number">{totalUsers}</span>
                      {/* <span className="admin-growth-indicator admin-positive">
                        +12%
                      </span> */}
                    </div>
                  </div>
                </div>

                {/* Posts Chart */}
                <div className="admin-instagram-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon admin-posts-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                          fill="currentColor"
                        />
                        <path
                          d="M8.5 13.5L10.5 15.5L15.5 8.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="admin-stat-label">Posts</span>
                  </div>
                  <div className="admin-instagram-chart">
                    <div className="admin-chart-bars">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="admin-chart-bar">
                          <div
                            className="admin-bar-fill admin-posts-bar"
                            style={{
                              height: `${Math.random() * 80 + 10}%`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="admin-chart-value">
                      <span className="admin-main-number">{totalPosts}</span>
                      {/* <span className="admin-growth-indicator admin-positive">
                        +8%
                      </span> */}
                    </div>
                  </div>
                </div>

                {/* Engagement Chart */}
                <div className="admin-instagram-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon admin-engagement-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <span className="admin-stat-label">Engagement</span>
                  </div>
                  <div className="admin-instagram-chart">
                    <div className="admin-chart-bars">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="admin-chart-bar">
                          <div
                            className="admin-bar-fill admin-engagement-bar"
                            style={{
                              height: `${Math.random() * 70 + 15}%`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="admin-chart-value">
                      <span className="admin-main-number">
                        {totalUsers > 0
                          ? Math.round((totalPosts / totalUsers) * 100) / 100
                          : 0}
                      </span>
                      <span className="admin-growth-indicator admin-neutral">
                        Posts/User
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Overview - Updated */}
              <div className="admin-weekly-overview">
                <div className="admin-weekly-header">
                  <h3>This Week's Activity</h3>
                  <div className="admin-weekly-legend">
                    {/* <span className="admin-legend-item">
                      <div className="admin-legend-color admin-users-legend"></div>
                      Users
                    </span> */}
                    <span className="admin-legend-item">
                      <div className="admin-legend-color admin-posts-legend"></div>
                      Posts
                    </span>
                  </div>
                </div>
                <div className="admin-week-chart">
                  {weeklyActivity.length > 0
                    ? weeklyActivity.map((dayData, i) => {
                        const maxActivity = Math.max(
                          ...weeklyActivity.map((d) => d.total_activity)
                        );
                        const postHeight =
                          maxActivity > 0
                            ? (dayData.posts_created / maxActivity) * 60 + 10
                            : 10;

                        return (
                          <div key={dayData.day} className="admin-day-stat">
                            <div className="admin-day-bars-container">
                              {dayData.posts_created > 0 && (
                                <div
                                  className="admin-day-bar admin-posts-day-bar"
                                  style={{
                                    height: `${postHeight}%`,
                                    animationDelay: `${i * 0.2 + 0.1}s`,
                                  }}
                                  title={`${dayData.posts_created} posts created`}
                                ></div>
                              )}
                            </div>
                            <div className="admin-day-info">
                              <span className="admin-day-label">
                                {dayData.day}
                              </span>
                              <div className="admin-day-counts">
                                <span className="admin-posts-count">
                                  {dayData.posts_created > 0
                                    ? `${dayData.posts_created}-posts`
                                    : "No posts"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, i) => (
                          <div key={day} className="admin-day-stat">
                            <div className="admin-day-bars-container">
                              <div className="admin-day-bar admin-no-data-bar"></div>
                            </div>
                            <div className="admin-day-info">
                              <span className="admin-day-label">{day}</span>
                              <div className="admin-day-counts">
                                <span className="admin-no-data-text">
                                  No data
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Posts Section */}
        <div className="admin-posts-section">
          <h3>
            {isSearchMode
              ? `Found ${postsToDisplay.length} Posts`
              : "All Posts"}
          </h3>
          {postsToDisplay.length === 0 ? (
            <div className="admin-no-posts-message">
              <svg
                className="admin-no-posts-icon"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="#999"
              >
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" />
              </svg>
              <span>
                {isSearchMode
                  ? "No posts found matching your search"
                  : "No posts available"}
              </span>
            </div>
          ) : (
            <div className="admin-posts-grid">
              {postsToDisplay.map((post, idx) => (
                <div
                  key={idx}
                  className="admin-post-card"
                  onClick={() => handleShowProfilePostDialog(post)}
                >
                  <img
                    src={`http://localhost:5000/static/posts/${post.image_path}`}
                    alt={`Post ${idx}`}
                    className="admin-post-image"
                  />
                  <div className="admin-post-overlay">
                    <div className="admin-post-title">{post.title}</div>
                    <div className="admin-post-author">by {post.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ProfilePostCard Dialog */}
        {isProfilePostDialogOpen && selectedPost && (
          <ProfilePostCard
            post={selectedPost}
            onClose={handleCloseProfilePostDialog}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
