import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import CodeEditor from "../components/CodeEditor";
import "../styles/AccessControl.css";

export default function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const [accessStatus, setAccessStatus] = useState("checking"); // checking, approved, pending, rejected
  const [roomOwner, setRoomOwner] = useState(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [approvalTimeout, setApprovalTimeout] = useState(null);

  // Redirect to home if username missing
  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }
  }, [username, navigate]);

  // Check room access on mount
  useEffect(() => {
    if (!username || !roomId) return;

    // Request room access from server
    checkRoomAccess();

    // Set 2-minute timeout for approval request
    const timeout = setTimeout(() => {
      if (accessStatus === "pending") {
        setAccessStatus("rejected");
        setPendingMessage("⏱️ Request timed out. Please try again.");
      }
    }, 120000); // 2 minutes

    setApprovalTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [username, roomId]);

  // Setup socket listeners for access control
  useEffect(() => {
    if (!socket || !username || !roomId) return;

    // Listen for access approval
    socket.on("access-approved", ({ roomId: approvedRoomId }) => {
      if (approvedRoomId === roomId) {
        setAccessStatus("approved");
        setPendingMessage("✅ Access granted!");
        if (approvalTimeout) clearTimeout(approvalTimeout);
      }
    });

    // Listen for access rejection
    socket.on("access-rejected", ({ roomId: rejectedRoomId, reason }) => {
      if (rejectedRoomId === roomId) {
        setAccessStatus("rejected");
        setPendingMessage(reason || "❌ Request was rejected by room owner.");
        if (approvalTimeout) clearTimeout(approvalTimeout);
      }
    });

    // Listen for room owner info
    socket.on("room-owner-info", ({ owner }) => {
      setRoomOwner(owner);
    });

    return () => {
      socket.off("access-approved");
      socket.off("access-rejected");
      socket.off("room-owner-info");
    };
  }, [socket, username, roomId, approvalTimeout]);

  const checkRoomAccess = () => {
    // Emit request to check room access
    socket.emit("request-room-access", { 
      roomId, 
      username 
    });

    // Set to pending state
    setAccessStatus("pending");
    setPendingMessage("🔄 Waiting for room owner approval...");
  };

  const handleRetryRequest = () => {
    setAccessStatus("pending");
    setPendingMessage("🔄 Sending new request...");
    
    // Clear old timeout
    if (approvalTimeout) clearTimeout(approvalTimeout);
    
    // Set new timeout
    const timeout = setTimeout(() => {
      if (accessStatus === "pending") {
        setAccessStatus("rejected");
        setPendingMessage("⏱️ Request timed out. Please try again.");
      }
    }, 120000);
    
    setApprovalTimeout(timeout);
    
    // Resend request
    socket.emit("request-room-access", { 
      roomId, 
      username 
    });
  };

  const handleGoHome = () => {
    // Clean up socket listeners
    socket.off("access-approved");
    socket.off("access-rejected");
    socket.off("room-owner-info");
    navigate("/");
  };

  // Redirect if not authenticated
  if (!username) {
    return null;
  }

  // Show access control UI while checking
  if (accessStatus === "checking") {
    return (
      <div className="access-control-container">
        <div className="access-card checking">
          <div className="spinner-large"></div>
          <h2>Verifying Room Access</h2>
          <p>Please wait while we verify your access...</p>
        </div>
      </div>
    );
  }

  // Show pending approval UI
  if (accessStatus === "pending") {
    return (
      <div className="access-control-container">
        <div className="access-card pending">
          <div className="pending-animation">
            <div className="pending-dot dot-1"></div>
            <div className="pending-dot dot-2"></div>
            <div className="pending-dot dot-3"></div>
          </div>

          <h2>Pending Approval</h2>
          <p className="pending-message">{pendingMessage}</p>

          <div className="pending-details">
            <div className="detail-item">
              <span className="detail-label">Room ID:</span>
              <span className="detail-value">{roomId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Your Name:</span>
              <span className="detail-value">{username}</span>
            </div>
            {roomOwner && (
              <div className="detail-item">
                <span className="detail-label">Room Owner:</span>
                <span className="detail-value">{roomOwner}</span>
              </div>
            )}
          </div>

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <span>The room owner will need to approve your access. This usually takes a few seconds.</span>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleGoHome}>
              <span>← </span>
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection UI
  if (accessStatus === "rejected") {
    return (
      <div className="access-control-container">
        <div className="access-card rejected">
          <div className="rejection-icon">❌</div>

          <h2>Access Denied</h2>
          <p className="rejection-message">{pendingMessage}</p>

          <div className="rejection-reasons">
            <div className="reason-item">
              <span className="reason-icon">🔒</span>
              <span>Possible reasons:</span>
            </div>
            <ul>
              <li>Room owner declined your request</li>
              <li>Request timeout (exceeded 2 minutes)</li>
              <li>Room has reached member limit</li>
              <li>Room is private or archived</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={handleRetryRequest}>
              <span>🔄 </span>
              <span>Send Another Request</span>
            </button>
            <button className="btn-secondary" onClick={handleGoHome}>
              <span>← </span>
              <span>Go Home</span>
            </button>
          </div>

          <p className="help-text">
            💡 Tip: Contact the room owner directly to ask them to approve your request.
          </p>
        </div>
      </div>
    );
  }

  // Access approved - show editor
  if (accessStatus === "approved") {
    return <CodeEditor roomId={roomId} username={username} />;
  }

  return null;
}