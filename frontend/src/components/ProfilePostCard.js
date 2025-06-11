import React, { useState, useEffect, useRef } from "react";
import "../styles/ProfilePostCard.css";
import axios from "axios";
import { FaTimes } from "react-icons/fa"; // Import the close icon
import FullTripDialog from "../components/FullTripDialog.js";
import HighlightDialog from "../components/HighlightDialog.js";
import CommentDialog from "../components/CommentDialog.js";

const ProfilePostCard = ({ post, onClose }) => {
  const [dropdownVisibility, setDropdownVisibility] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFullTripDialogOpen, setIsFullTripDialogOpen] = useState(false);
  const [editablePostData, setEditablePostData] = useState(null); // Post data to send to HighlightDialog
  const [openHighlightDialog, setOpenHighlightDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const lastPostElementRef = useRef();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesData, setLikesData] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [localPost, setLocalPost] = useState(post);
  const [admin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchPosts();
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("username");
    console.log(userName);
    if (userName === "admin") {
      setIsAdmin(true);
    }
    setCurrentUserId(userId);
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/posts/get_posts?limit=${limit}&offset=${offset}`
      );
      const newPosts = response.data.posts;
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        setOffset((prevOffset) => prevOffset + limit);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!hasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchPosts();
      }
    });
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }
  }, [posts, hasMore]);

  const handleDropdownToggle = (postId) => {
    setDropdownVisibility(dropdownVisibility === postId ? null : postId);
  };

  const handleCloseFullTripDialog = () => {
    setIsFullTripDialogOpen(false); // Close FullTripDialog
  };

  const handleShowFullTrip = async (postId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log(postId);
      const response = await axios.get(
        `http://localhost:5000/posts/get_trips_by_post/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);
      if (Array.isArray(response.data)) {
        setTripData(response.data); // Update tripData state
        setIsFullTripDialogOpen(true); // Now open dialog after data fetched
      } else {
        console.error(
          "Error fetching trips:",
          response.data || "Unknown error"
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch trips:",
        error.response?.data || error.message || "Unknown error"
      );
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const handleEditPost = (post) => {
    setEditablePostData(post); // Set selected post data
    setOpenHighlightDialog(true); // Open HighlightDialog
  };

  const handleHighlightDialogClose = () => {
    setOpenHighlightDialog(false);
    setEditablePostData(null);
  };

  const handleDeletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token"); // Get JWT token

      const response = await fetch(
        `http://localhost:5000/posts/delete_post/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("Post deleted successfully!");
        window.location.reload(); // You can also consider re-fetching posts instead of full reload
      } else {
        const errorData = await response.json();
        console.error("Failed to delete the post:", errorData);
        alert("Failed to delete post: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An unexpected error occurred while deleting the post.");
    }
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    posts.forEach((post) => {
      axios
        .get(`http://localhost:5000/posts/likes/${post.id}?user_id=${userId}`)
        .then((res) => {
          setLikesData((prev) => ({
            ...prev,
            [post.id]: res.data,
          }));
        })
        .catch((err) => console.error("Error fetching likes:", err));
    });
  }, [posts]);

  const handleLike = async (postId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://localhost:5000/posts/toggle_like",
        { post_id: postId, user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLikesData((prev) => {
        const prevCount = prev[postId]?.count || 0;
        const newCount = res.data.liked ? prevCount + 1 : prevCount - 1;
        return {
          ...prev,
          [postId]: { liked: res.data.liked, count: newCount },
        };
      });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleCommentAdded = (postId) => {
    if (postId === localPost.id) {
      setLocalPost((prev) => ({
        ...prev,
        commentCount: (prev.commentCount || 0) + 1,
      }));
    }
  };

  const handleCommentDeleted = (postId) => {
    if (postId === localPost.id && localPost.commentCount > 0) {
      setLocalPost((prev) => ({
        ...prev,
        commentCount: prev.commentCount - 1,
      }));
    }
  };

  // Assuming you have a date string like "Tue, 20 May 2025 14:26:30 GMT"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="profile-post-dialog-wrapper">
      <div
        className="profile-post-dialog"
        role="dialog"
        aria-modal="true"
        key={post.id}
      >
        {loading && <div className="loading-spinner">Loading trips...</div>}
        {/* Post Header */}
        <div className="profile-post-header">
          <div className="profile-profile-icon">
            {post.username ? post.username.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="profile-post-card-username">{post.username}</div>

          <button
            className="profile-show-full-trip-btn"
            onClick={() => handleShowFullTrip(post.id)}
          >
            Show Full Trip
          </button>
          <div className="profile-highlight-close-btn" onClick={handleClose}>
            <FaTimes />
          </div>

          {((currentUserId && currentUserId === String(post.user_id)) ||
            admin) && (
            <div
              className="profile-dropdown-btn"
              onClick={() => handleDropdownToggle(post.id)}
            >
              &#x2026;
              {dropdownVisibility === post.id && (
                <div className="profile-dropdown-menu">
                  {currentUserId && currentUserId === String(post.user_id) && (
                    <button onClick={() => handleEditPost(post)}>
                      Edit Post
                    </button>
                  )}
                  <button onClick={() => handleDeletePost(post.id)}>
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Image */}
        <img
          src={`http://localhost:5000/static/posts/${post.image_path}`}
          alt="Post_images"
          className="profile-post-image"
        />

        {/* Post Details */}
        <div className="profile-post-details">
          <h2 className="profile-post-title">{localPost.title}</h2>
          <p className="profile-post-description">{localPost.description}</p>

          <div className="profile-post-meta">
            <span>Total Days: {localPost.total_days}</span>
            <span>Created at: {formatDate(post.created_at)}</span>
            <span>Total Charge: ₹{localPost.total_charge}</span>
          </div>
        </div>

        {/* Post Footer */}
        <div className="profile-post-footer">
          <div className="profile-likes-comments">
            <span
              style={{ cursor: "pointer" }}
              onClick={() => handleLike(post.id)}
            >
              {likesData[post.id]?.liked ? "❤️" : "🤍"}{" "}
              {likesData[post.id]?.count || 0} Likes
            </span>
            <span
              className="comment-button"
              onClick={() => {
                if (selectedPostId === post.id && showComments) {
                  setShowComments(false);
                  setSelectedPostId(null);
                } else {
                  setSelectedPostId(post.id);
                  setShowComments(true);
                }
              }}
            >
              💬 {localPost.commentCount || 0} Comments
            </span>
          </div>
        </div>
      </div>

      {isFullTripDialogOpen && (
        <FullTripDialog onClose={handleCloseFullTripDialog} trips={tripData} />
      )}

      {/* HighlightDialog for editing post */}
      {openHighlightDialog && editablePostData && (
        <HighlightDialog
          open={openHighlightDialog}
          handleClose={handleHighlightDialogClose}
          editableData={editablePostData}
          fetchPosts={fetchPosts}
          onClose={handleHighlightDialogClose}
          fromProfile={true}
          handleCloseBothDialogs={handleClose}
        />
      )}

      {showComments && (
        <CommentDialog
          postId={selectedPostId}
          onClose={() => {
            setShowComments(false);
            setSelectedPostId(null);
          }}
          onCommentAdded={handleCommentAdded}
          updateCommentCount={(postId, newCount) => {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === postId ? { ...p, commentCount: newCount } : p
              )
            );
          }}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </div>
  );
};

export default ProfilePostCard;
