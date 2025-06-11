import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../styles/Newsfeed.css";
import HighlightDialog from "../components/HighlightDialog.js"; // Make sure you import this
import FullTripDialog from "../components/FullTripDialog.js";
import CommentDialog from "../components/CommentDialog.js";
// NEWLY ADDED: Import the search emitter
import { searchEmitter } from "../components/TopBar.js"; // Make sure the path is correct

const NewsFeed = (post, userId) => {
  const [posts, setPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [dropdownVisibility, setDropdownVisibility] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const lastPostElementRef = useRef();

  // Highlight Dialog states
  const [openHighlightDialog, setOpenHighlightDialog] = useState(false);
  const [editablePostData, setEditablePostData] = useState(null); // Post data to send to HighlightDialog
  const [isFullTripDialogOpen, setIsFullTripDialogOpen] = useState(false);
  const [tripData, setTripData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesData, setLikesData] = useState({});
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showComments, setShowComments] = useState(false);

  // NEWLY ADDED: State for search results and tracking if we're in search mode
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);

    // NEWLY ADDED: Listen for search events
    searchEmitter.on("search", handleSearch);

    // NEWLY ADDED: Cleanup event listener
    return () => {
      searchEmitter.removeListener("search", handleSearch);
    };
  }, []);

  // NEWLY ADDED: Search handler function
  const handleSearch = async (query) => {
    if (!query || query.trim() === "") {
      // If query is empty, reset to normal mode and fetch normal posts
      setIsSearchMode(false);
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      fetchPosts();
      return;
    }

    try {
      setLoading(true);
      setSearchQuery(query);
      setIsSearchMode(true);

      const response = await axios.get(
        `http://localhost:5000/posts/search_posts?query=${encodeURIComponent(
          query
        )}`
      );

      if (response.data && response.data.posts) {
        setPosts(response.data.posts);
        setHasMore(false); // No infinite scroll in search mode
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    // NEWLY MODIFIED: Don't fetch if in search mode
    if (isSearchMode) return;

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

  useEffect(() => {
    // NEWLY MODIFIED: Don't observe if in search mode or no more posts
    if (!hasMore || isSearchMode) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchPosts();
      }
    });
    if (lastPostElementRef.current) {
      observer.current.observe(lastPostElementRef.current);
    }
  }, [posts, hasMore, isSearchMode]); // NEWLY MODIFIED: Added isSearchMode dependency

  const handleDropdownToggle = (postId) => {
    setDropdownVisibility(dropdownVisibility === postId ? null : postId);
  };

  const handleEditPost = (post) => {
    setEditablePostData(post); // Set selected post data
    setOpenHighlightDialog(true); // Open HighlightDialog
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

  const handleHighlightDialogClose = () => {
    setOpenHighlightDialog(false);
    setEditablePostData(null);
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

  const handleCloseFullTripDialog = () => {
    setIsFullTripDialogOpen(false); // Close FullTripDialog
  };

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
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      )
    );
  };

  // Assuming you have a date string like "Tue, 20 May 2025 14:26:30 GMT"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="newsfeed-main-wrapper">
      <div className="newsfeed-main-container">
        {/* NEWLY ADDED: Search results heading */}
        {isSearchMode && (
          <div className="search-results-header">
            <h3>Search Results for "{searchQuery}"</h3>
            {posts.length === 0 && !loading && (
              <p className="newsfeed-no-search-found">
                No posts found matching your search.
              </p>
            )}
            <button
              className="clear-search-btn"
              onClick={() => {
                setIsSearchMode(false);
                setPosts([]);
                setOffset(0);
                setHasMore(true);
                fetchPosts();
                window.location.reload();
              }}
            >
              Clear Search
            </button>
          </div>
        )}

        <div className="newsfeed-container">
          {loading && <div className="loading-spinner">Loading...</div>}
          {posts.map((post, index) => {
            const isLastPost = index === posts.length - 1;
            return (
              <div
                key={post.id}
                className="post-card"
                ref={isLastPost && !isSearchMode ? lastPostElementRef : null}
              >
                {/* Post Header */}
                <div className="post-header">
                  <div className="profile-icon">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="username">{post.username}</div>

                  <button
                    className="show-full-trip-btn"
                    onClick={() => handleShowFullTrip(post.id)}
                  >
                    Show Full Trip
                  </button>

                  {currentUserId && currentUserId === String(post.user_id) && (
                    <div
                      className="dropdown-btn"
                      onClick={() => handleDropdownToggle(post.id)}
                    >
                      &#x2026;
                      {dropdownVisibility === post.id && (
                        <div className="dropdown-menu">
                          <button onClick={() => handleEditPost(post)}>
                            Edit Post
                          </button>
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
                  className="post-image"
                />

                {/* Post Details */}
                <div className="post-details">
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-description">{post.description}</p>

                  <div className="post-meta">
                    <span>Total Days: {post.total_days}</span>
                    <span>Created at: {formatDate(post.created_at)}</span>
                    <span>Total Charge: ₹{post.total_charge}</span>
                  </div>
                </div>

                {/* Post Footer */}
                <div className="post-footer">
                  <div className="likes-comments">
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
                      💬 {post.commentCount || 0} Comments
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HighlightDialog for editing post */}
      {openHighlightDialog && editablePostData && (
        <HighlightDialog
          open={openHighlightDialog}
          handleClose={handleHighlightDialogClose}
          editableData={editablePostData} // Pass post data to HighlightDialog
          onClose={handleHighlightDialogClose}
          fetchPosts={fetchPosts}
          fromNewsfeed={true}
        />
      )}

      {/* Full Trip Dialog */}
      {isFullTripDialogOpen && (
        <FullTripDialog onClose={handleCloseFullTripDialog} trips={tripData} />
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
        />
      )}
    </div>
  );
};

export default NewsFeed;
