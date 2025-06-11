import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/CommentDialog.css";
import { toZonedTime, format } from 'date-fns-tz';

const CommentDialog = ({ postId, onClose, onCommentAdded, updateCommentCount, onCommentDeleted }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));
    const currentUser = localStorage.getItem("username");
    const userId = user?.id;

    useEffect(() => {
        if (postId) {
            axios
                .get(`http://localhost:5000/posts/comments/${postId}`)
                .then((res) => {
                    setComments(res.data);
                })
                .catch((err) => console.error("Error fetching comments:", err));
        }
    }, [postId]);

    // UseEffect to fetch comments when the component is mounted or when postId changes
    useEffect(() => {
        fetchComments();
    }, [postId]); // Add dependencies if necessary

    const handleAddComment = async () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");

        if (!newComment.trim()) return;

        try {
            const res = await axios.post(
                "http://localhost:5000/posts/comments",
                {
                    post_id: postId,
                    comment: newComment,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setComments(prev => [
                ...prev,
                {
                    username: username, // Assumes `user.username` is in scope
                    id: res.data.commentId,
                    comment: newComment,
                    created_at: new Date().toUTCString(),
                },
            ]);

            setNewComment("");

            onCommentAdded(postId); // Add this line
            
            setNewComment("");
            fetchComments();
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/posts/comments/${postId}`); // Replace postId with your actual post ID
            console.log(res.data);
            setComments(res.data); // Set the comments in the state
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const handleEdit = (comment) => {
        const updated = prompt("Edit your comment:", comment.comment);
        if (updated !== null) {
            axios.put(`http://localhost:5000/posts/comments/edit/${comment.id}`, {
                comment: updated,
            }).then(() => {
                fetchComments(); // Re-fetch comments after update
            });
        }
    };

    const handleDelete = (commentId) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            axios
                .delete(`http://localhost:5000/posts/comments/delete/${commentId}`)
                .then((res) => {
                    const updatedCount = res.data.commentCount;

                    // Remove the deleted comment from local state
                    setComments(prev => prev.filter(c => c.id !== commentId));

                    // Inform the parent to update the comment count
                    updateCommentCount(postId, updatedCount);
                    fetchComments();
                    if (onCommentDeleted) {
                        onCommentDeleted(postId);
                    }
                })
                .catch(err => console.error("Delete error:", err));
        }
    };


    return (
        <div className="comment-dialog">
            <div className="comment-header">
                <span>Comments</span>
                <button className="close-btn" onClick={onClose}>✖</button>
            </div>
            <div className="comment-body">
                {comments.length === 0 ? (
                    <p className="no-comments">No comments yet.</p>
                ) : (
                    comments.map((comment, index) => (
                        <div key={index} className="comment-item">
                            <div className="comment-header">
                                <div className="avatar-username">
                                    <div className="avatar">{comment.username.charAt(0).toUpperCase()}</div>
                                    <strong className="username">{comment.username}</strong>
                                </div>
                                <div className="comment-text">
                                    {comment.comment}
                                    {comment.is_edited === 1 && <span style={{ marginLeft: "4px" }}>(edited)</span>}
                                </div>
                            </div>

                            <div className="comment-footer-with-actions">
                                <small className="comment-time">{comment.created_at}</small>
                                {comment.username === currentUser && (
                                    <div className="comment-actions-inline">
                                        <button className="comment-edit-btn" onClick={() => handleEdit(comment)}>Edit</button>
                                        <button className="comment-delete-btn" onClick={() => handleDelete(comment.id)}>Delete</button>
                                    </div>
                                )}
                            </div>

                            {index !== comments.length - 1 && <hr />}
                        </div>
                    ))
                )}
            </div>


            <div className="comment-footer">
                <textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button className="comment-submit" onClick={handleAddComment}>Post</button>
            </div>
        </div>
    );
};

export default CommentDialog;