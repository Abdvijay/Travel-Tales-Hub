import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState(1); // Step 1: Verify PIN, Step 2: Reset Password
    const [loading, setLoading] = useState(false); // Loading state
    const [pin, setPin] = useState(["", "", "", "", "", ""]);

    // Function to handle PIN input changes
    const handlePinChange = (index, value) => {
        if (!/^\d?$/.test(value)) return; // Only allow single digit numbers

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Move focus to the next input box automatically
        if (value && index < 5) {
            document.getElementById(`pin-${index + 1}`).focus();
        }
    };

    // Function to combine PIN digits into a single string before sending
    const getFullPin = () => pin.join("");

    // ✅ Step 1: Verify Phone & PIN (Like Login)
    const handleVerifyPin = async (e) => {
        e.preventDefault();
        const fullPin = getFullPin();

        if (fullPin.length !== 6) {
            alert("Enter a valid 6-digit PIN.");
            return;
        }

        setLoading(true); // Start loading
        try {
            const response = await axios.post("http://localhost:5000/auth/verify-pin", {
                phone_number: phoneNumber,
                pin_number: fullPin,
            });

            if (response.status === 200) {
                alert("✅ PIN verified successfully!");
                setStep(2); // Move to Reset Password Step
            }
        } catch (error) {
            alert(error.response?.data?.error || "❌ Invalid phone number or PIN!");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // ✅ Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            alert("❌ Please fill in all fields.");
            return;
        }

        if (newPassword.length < 6) {
            alert("❌ Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("❌ Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/auth/reset-password", {
                phone_number: phoneNumber,
                new_password: newPassword,
            });

            if (response.status === 200) {
                alert("✅ Password updated successfully!");
                navigate("/auth"); // Redirect to Sign In
            }
        } catch (error) {
            alert(error.response?.data?.error || "❌ Password reset failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>

            {step === 1 ? (
                // ✅ Step 1: Phone & PIN Verification (Like Login)
                <form onSubmit={handleVerifyPin}>
                    <label>📱 Phone Number:</label>
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number"
                        required
                    />

                    <label>🔢 Enter PIN:</label>
                    <div className="pin-input-container">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                id={`pin-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                className="pin-input-box"
                            />
                        ))}
                    </div>

                    <div className="button-group">
                        <button type="submit" disabled={loading}>
                            {loading ? "Verifying..." : "Verify PIN"}
                        </button>
                        <button type="button" className="back-button" onClick={() => navigate("/auth")}>
                            Back
                        </button>
                    </div>
                </form>
            ) : (
                // ✅ Step 2: Reset Password
                <form onSubmit={handleResetPassword}>
                    <label>🔑 New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                    />

                    <label>🔁 Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                    />

                    <div className="button-group">
                        <button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Reset Password"}
                        </button>
                        <button type="button" className="back-button" onClick={() => navigate("/auth")}>
                            Back
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;