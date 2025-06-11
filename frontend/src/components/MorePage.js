import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/MorePage.css";
import axios from 'axios';

const MorePage = () => {
    const navigate = useNavigate();

    const [showPinModal, setShowPinModal] = useState(false);
    const [password, setPassword] = useState("");
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    // Change from single string to array of 6 digits
    const [newPin, setNewPin] = useState(Array(6).fill(""));

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/auth");
        }
    }, [navigate]);

    const handleChangePassword = () => {
        navigate('/forgot-password');
    };

    const handleShowPin = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/auth/get-pin', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.status === 'success') {
                alert(`Your PIN is: ${response.data.pin}`);
            } else {
                alert('Failed to fetch PIN');
            }
        } catch (err) {
            console.error('Error fetching PIN:', err);
            alert('An error occurred while fetching PIN.');
        }
    };

    const handleLogout = () => {
        // localStorage.removeItem("username");
        // localStorage.removeItem("token");
        navigate("/auth", { replace: true });
        // window.location.reload();
    };

    const handleVerifyPassword = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log(token);
            const response = await axios.post("http://localhost:5000/auth/verify-password", {
                password
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(response.data);
            if (response.data.status === "success") {
                setIsPasswordVerified(true);
            } else {
                alert(response.data.message);
                setIsPasswordVerified(false); // Reset PIN fields if password doesn't match
            }
        } catch (err) {
            alert("Verification failed.");
        }
    };

    // Handle input changes for each PIN digit
    const handlePinChange = (index, value) => {
        // Only allow numbers
        if (value !== "" && !/^\d+$/.test(value)) {
            return;
        }

        const newPinArray = [...newPin];
        newPinArray[index] = value;
        setNewPin(newPinArray);

        // Auto-focus next input if this one is filled
        if (value !== "" && index < 5) {
            const nextInput = document.getElementById(`pin-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    const handleUpdatePin = async () => {
        try {
            const token = localStorage.getItem("token");
            
            // Join the pin array into a string
            const pinString = newPin.join("");
    
            // Check if the new PIN is a 6-digit number
            if (pinString.length !== 6 || isNaN(pinString)) {
                alert("PIN must be a 6-digit number");
                return;
            }
    
            // Ensure the token is valid
            if (!token) {
                alert("Authorization token is missing.");
                return;
            }
    
            // Send the POST request
            const response = await axios.post("http://localhost:5000/auth/update-pin", {
                newPin: pinString
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            if (response.data.status === "success") {
                alert("PIN updated successfully!");
                setShowPinModal(false);
                setPassword("");
                setNewPin(Array(6).fill(""));
                setIsPasswordVerified(false);
            } else {
                alert("Failed to update PIN.");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Error updating PIN.");
        }
    };    


    return (
        <div className="more-page-container">
            <h2 className="more-page-title">Account Settings & Actions</h2>

            <div className="more-page-card-grid">
                <div className="more-page-row">
                    <div className="more-page-instruction-card">
                        <h3 className="more-page-card-title">🔐 Change Your Password</h3>
                        <ol className="more-page-steps-list">
                            <li>Click the <strong>"Change Password"</strong> button.</li>
                            <li>Enter current and new password in the form.</li>
                            <li>Click <strong>"Save Changes"</strong>.</li>
                        </ol>
                        <button className="more-page-action-button" onClick={handleChangePassword}>Change Password</button>
                    </div>

                    <div className="more-page-instruction-card">
                        <h3 className="more-page-card-title">🚪 Logout</h3>
                        <ol className="more-page-steps-list">
                            <li>Click the <strong>"Logout"</strong> button.</li>
                            <li>You'll be signed out securely.</li>
                            <li>Log in anytime to continue.</li>
                        </ol>
                        <button className="more-page-action-button more-page-logout-button" onClick={handleLogout}>Logout</button>
                    </div>
                </div>

                <div className="more-page-row">
                    <div className="more-page-instruction-card">
                        <h3 className="more-page-card-title">📌 View Your PIN</h3>
                        <ol className="more-page-steps-list">
                            <li>Click the <strong>"Show PIN"</strong> button.</li>
                            <li>Your 6-digit PIN will appear.</li>
                            <li>Use it when prompted for verification.</li>
                        </ol>
                        <button className="more-page-action-button" onClick={handleShowPin}>Show PIN</button>
                    </div>

                    <div className="more-page-instruction-card">
                        <h3 className="more-page-card-title">🔁 Change Your PIN</h3>
                        <ol className="more-page-steps-list">
                            <li>Click the <strong>"Change PIN"</strong> button.</li>
                            <li>Verify password, enter new PIN.</li>
                            <li>Click <strong>"Update PIN"</strong>.</li>
                        </ol>
                        <button className="more-page-action-button" onClick={() => setShowPinModal(true)}>Change PIN</button>
                    </div>
                </div>
            </div>

            {/* Change PIN Modal */}
            {showPinModal && (
                <div className="pin-modal-overlay">
                    <div className="pin-modal-content">
                        <h3>Change PIN</h3>
                        {!isPasswordVerified ? (
                            <>
                                <p>Enter your password:</p>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pin-modal-input"
                                />
                                <div className="pin-modal-actions">
                                    <button className="pin-modal-btn" onClick={() => setShowPinModal(false)}>Back</button>
                                    <button className="pin-modal-btn" onClick={handleVerifyPassword}>Verify Password</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>Enter new 6-digit PIN:</p>
                                <div className="pin-modal-input-container">
                                    {newPin.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`pin-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handlePinChange(index, e.target.value)}
                                            className="pin-modal-input-box"
                                        />
                                    ))}
                                </div>
                                <div className="pin-modal-actions">
                                    <button className="pin-modal-btn" onClick={() => {
                                        setShowPinModal(false);
                                        setIsPasswordVerified(false);
                                        setPassword("");
                                        setNewPin(Array(6).fill(""));
                                    }}>Back</button>
                                    <button className="pin-modal-btn" onClick={handleUpdatePin}>Update PIN</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MorePage;