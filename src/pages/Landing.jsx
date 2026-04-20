import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { enableDemoMode } = useAuth();

  const handleTryDemo = () => {
    enableDemoMode();
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-container fade-in">
      <div className="glass-card landing-card">
        <h1>Case Study Simulator</h1>
        <p className="landing-desc">
          Simulate real-world decisions and explore outcomes based on your choices. 
          Step into the shoes of a decision maker and see where your paths lead.
        </p>
        <div className="card-actions landing-actions">
          <button className="btn-primary" onClick={handleLogin}>Login / Signup</button>
          <button className="btn-secondary" onClick={handleTryDemo}>Try Demo</button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
