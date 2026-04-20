import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserTotalPoints } from '../services/firestoreService';

const TIERS = [
  { label: 'Rookie',     emoji: '🌱', color: '#10b981', glow: 'rgba(16,185,129,0.2)',  min: 0,   max: 39  },
  { label: 'Analyst',    emoji: '📊', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)',  min: 40,  max: 99  },
  { label: 'Strategist', emoji: '🎯', color: '#6366f1', glow: 'rgba(99,102,241,0.3)',  min: 100, max: 199 },
  { label: 'Expert',     emoji: '🏆', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  min: 200, max: null },
];

const getRank = (points) => {
  return [...TIERS].reverse().find(t => points >= t.min) || TIERS[0];
};

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalPoints, setTotalPoints] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    getUserTotalPoints(currentUser.uid).then(setTotalPoints);
  }, [currentUser, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) return null;
  if (location.pathname === '/login' || location.pathname === '/signup') return null;

  const rank = totalPoints !== null ? getRank(totalPoints) : null;
  const currentTierIndex = rank ? TIERS.findIndex(t => t.label === rank.label) : 0;
  const nextTier = TIERS[currentTierIndex + 1] || null;
  const ptsToNext = nextTier ? nextTier.min - totalPoints : null;

 
  const tierMin = rank ? rank.min : 0;
  const tierMax = nextTier ? nextTier.min : totalPoints + 1;
  const tierProgress = Math.min(100, Math.round(((totalPoints - tierMin) / (tierMax - tierMin)) * 100));

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <span className="logo-icon">📊</span> Decision Simulator
      </div>

      <div className="navbar-menu">
        {currentUser && (
          <>
            {rank && totalPoints !== null && (
              <div ref={popupRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowPopup(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${rank.color}`,
                    borderRadius: '99px', padding: '4px 14px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 0 10px ${rank.glow}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: rank.color }}>
                    {rank.emoji} {rank.label}
                  </span>
                  <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
                  <span style={{
                    fontSize: '0.82rem', fontWeight: '600',
                    color: totalPoints >= 0 ? '#6ee7b7' : '#fda4af'
                  }}>
                    🏅 {totalPoints > 0 ? `+${totalPoints}` : totalPoints} pts
                  </span>
                </button>
                {showPopup && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: '285px', zIndex: 200,
                    background: 'rgba(15, 23, 42, 0.97)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px', padding: '1.25rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.15s ease-out',
                  }}>
                    <p style={{
                      fontSize: '0.72rem', color: '#64748b', marginBottom: '1rem',
                      textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600'
                    }}>
                      Rank Progress
                    </p>
                    {TIERS.map((tier) => {
                      const isCurrentTier = tier.label === rank.label;
                      const isUnlocked = totalPoints >= tier.min;
                      return (
                        <div key={tier.label} style={{
                          display: 'flex', alignItems: 'center', gap: '0.65rem',
                          marginBottom: '0.85rem',
                          opacity: isUnlocked ? 1 : 0.3,
                          transition: 'opacity 0.2s',
                        }}>
                          <span style={{ fontSize: '1.15rem', minWidth: '24px', textAlign: 'center' }}>
                            {tier.emoji}
                          </span>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{
                                fontSize: '0.83rem',
                                fontWeight: isCurrentTier ? '700' : '500',
                                color: isCurrentTier ? tier.color : '#94a3b8',
                              }}>
                                {tier.label}
                                {isCurrentTier && (
                                  <span style={{
                                    marginLeft: '0.4rem', fontSize: '0.62rem',
                                    background: tier.color, color: '#000',
                                    borderRadius: '4px', padding: '1px 5px', fontWeight: '800'
                                  }}>
                                    YOU
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                {tier.max ? `${tier.min} – ${tier.max} pts` : `${tier.min}+ pts`}
                              </span>
                            </div>
                            {isCurrentTier && nextTier && (
                              <div style={{
                                width: '100%', height: '4px',
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '99px', overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${tierProgress}%`, height: '100%',
                                  background: tier.color, borderRadius: '99px',
                                  transition: 'width 0.6s ease',
                                  boxShadow: `0 0 6px ${tier.color}`,
                                }} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{
                      marginTop: '0.5rem', paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      fontSize: '0.78rem', textAlign: 'center', color: '#64748b'
                    }}>
                      {nextTier
                        ? <>
                            <span style={{ color: nextTier.color, fontWeight: '700' }}>
                              {ptsToNext} more pts
                            </span>
                            {' '}to unlock {nextTier.emoji} {nextTier.label}
                          </>
                        : <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                            🏆 You've reached the top rank!
                          </span>
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            <span className="user-id">{currentUser.email}</span>
            <button className="btn-text" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
