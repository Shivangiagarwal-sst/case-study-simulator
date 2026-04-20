import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = ({ isSignupRoute = false }) => {
  const { signup, loginWithEmail, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(isSignupRoute);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const emailRef = useRef(null);

  useEffect(() => {
    setIsSignup(isSignupRoute);
  }, [isSignupRoute]);


  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || email.trim() === '') {
      setError('Email cannot be empty.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth Error:', error.code, error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (isSignup) {
      navigate('/login');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="glass-card auth-card">
        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <p className="auth-toggle">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span onClick={toggleMode} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
            {isSignup ? 'Log in here' : 'Sign up here'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
