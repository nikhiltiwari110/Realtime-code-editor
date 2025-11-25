import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleJoin = () => {
    if (!roomId || !username) {
      alert("Please enter both Room ID and Username!");
      return;
    }
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  const handleGenerateRoomId = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(id);
      setIsGenerating(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="container-fluid home-container" ref={containerRef}>
      {/* Animated Grid Background */}
      <div className="grid-background"></div>
      
      {/* Mouse Follower Glow */}
      <div 
        className="mouse-glow" 
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      ></div>

      {/* Animated Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="orb orb-4"></div>
      
      <div className="row w-100">
        {/* Left Side - Feature Showcase */}
        <div className="col-md-6 d-flex justify-content-center align-items-center left-section">
          <div className="text-center feature-showcase">
            {/* 3D Rotating Icon */}
            <div className="icon-container-3d">
              <div className="icon-ring ring-1"></div>
              <div className="icon-ring ring-2"></div>
              <div className="icon-ring ring-3"></div>
              <div className="code-icon-3d">
                {/* <div className="icon-front">💻</div> */}
                {/* <div className="holographic-overlay"></div> */}
              </div>
            </div>
            
            <h2 className="feature-title">
              <span className="gradient-text-animated">Real-Time Collaboration</span>
            </h2>
            <p className="feature-subtitle">Code together, sync instantly, build faster</p>
            
            {/* Enhanced Feature Cards */}
            <div className="feature-cards">
              <div className="feature-card">
                <div className="card-glow"></div>
                <div className="card-icon">⚡</div>
                <div className="card-content">
                  <h4>Lightning Fast</h4>
                  <p>Zero latency sync</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="card-glow"></div>
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <h4>Multi-User</h4>
                  <p>Unlimited collaborators</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="card-glow"></div>
                <div className="card-icon">🔒</div>
                <div className="card-content">
                  <h4>Encrypted</h4>
                  <p>Bank-level security</p>
                </div>
              </div>
            </div>

            {/* Stats Counter */}
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Form */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center right-section">
          <div className="form-card-3d">
            {/* Animated Border */}
            <div className="card-border-animation"></div>
            
            {/* Header with Animation */}
            <div className="text-center mb-4 header-section">
              <div className="brand-container">
                <h1 className="brand-title-3d">
                  <span className="code-text">Code</span>
                  <span className="sync-text">Sync</span>
                  <div className="title-underline"></div>
                </h1>
              </div>
              <p className="tagline-enhanced">
                ✨ Code, Chat and Collaborate. All in Perfect Sync.
              </p>
              
              {/* Enhanced Status Badge */}
              <div className="status-badge-enhanced">
                <span className="status-pulse"></span>
                <span className="status-dot-enhanced"></span>
                <span className="status-text">LIVE • 247 ONLINE</span>
              </div>
            </div>

            {/* Input Fields with 3D Effect */}
            <div className="input-container-3d">
              <div className="input-group-enhanced">
                <div className="input-label">Room ID</div>
                <div className="input-wrapper-3d">
                  <div className="input-icon-3d">🔑</div>
                  <input
                    type="text"
                    className="form-control custom-input-3d"
                    placeholder="Enter or generate room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              <div className="input-group-enhanced">
                <div className="input-label">Username</div>
                <div className="input-wrapper-3d">
                  <div className="input-icon-3d">👤</div>
                  <input
                    type="text"
                    className="form-control custom-input-3d"
                    placeholder="Choose your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Enhanced Join Button */}
              <button
                onClick={handleJoin}
                className="btn join-button-3d"
                disabled={!roomId || !username}
              >
                <span className="button-bg-animate"></span>
                <span className="button-content">
                  <span className="button-text">Launch Session</span>
                  <span className="button-icon-3d">🚀</span>
                </span>
              </button>
            </div>

            {/* Stylish Divider */}
            <div className="divider-3d">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            {/* Enhanced Generate Button */}
            <button
              className="btn generate-button-3d"
              style={{ color: 'white' }}
              onClick={handleGenerateRoomId}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner-3d"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="generate-icon-3d">✨</span>
                  <span>Generate Unique Room ID</span>
                  <span className="generate-arrow">→</span>
                </>
              )}
            </button>

            {/* Footer Features */}
            <div className="footer-features">
              <div className="feature-badge">
                <span className="badge-icon">🔐</span>
                <span>E2E Encrypted</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">⚡</span>
                <span>Real-time</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">💾</span>
                <span>Auto-save</span>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="trust-bar">
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <span>No signup required</span>
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span>
                <span>Free forever</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
