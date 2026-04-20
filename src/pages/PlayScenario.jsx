import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScenarioById, saveResponse, getUserResponse } from '../services/firestoreService';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];
const CHOICE_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'];
const TIMER_SECONDS = 30;

const PlayScenario = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);
  const availableChoicesRef = useRef([]);

  useEffect(() => {
    const fetchScenario = async () => {
      setLoading(true);
      try {
        const existingResponse = await getUserResponse(id, currentUser.uid);
        if (existingResponse) { navigate(`/results/${id}`); return; }
        const data = await getScenarioById(id);
        if (data) setScenario(data);
        else setError('Scenario not found');
      } catch (err) {
        setError('Error loading scenario');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchScenario();
  }, [id, currentUser, navigate]);

 
  useEffect(() => {
    if (!scenario || submitting) return;

    const choiceCount = scenario.choiceCount || 2;
    availableChoicesRef.current = CHOICE_LABELS.slice(0, choiceCount).filter(
      label => scenario[`choice${label}`]
    );

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
     
          const choices = availableChoicesRef.current;
          const randomChoice = choices[Math.floor(Math.random() * choices.length)];
          setTimedOut(true);
          handleChoice(randomChoice, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [scenario]);

  const handleChoice = async (choiceKey, isTimeout = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const pointsEarned = scenario[`choice${choiceKey}`]?.score ?? 0;
      await saveResponse(id, currentUser.uid, choiceKey, pointsEarned);
      navigate(`/results/${id}`);
    } catch (err) {
      setError('Error saving your response');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading scenario...</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!scenario) return <div className="empty-state">Scenario not found</div>;

  const choiceCount = scenario.choiceCount || 2;
  const availableChoices = CHOICE_LABELS.slice(0, choiceCount).filter(
    label => scenario[`choice${label}`]
  );

  if (availableChoices.length < 2) {
    return (
      <div className="player-container fade-in">
        <div className="glass-card scenario-card">
          <div className="auth-error">This scenario has incomplete data and cannot be played.</div>
          <div className="card-actions" style={{ marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const timerColor = timeLeft > 20 ? '#10b981' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className="player-container fade-in">
      <div className="player-header">
        <span className="scenario-badge">{scenario.title}</span>
        {scenario.createdByEmail && (
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>by {scenario.createdByEmail}</span>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '0.4rem'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Time to decide</span>
          <span style={{
            fontWeight: '700', fontSize: '1rem', color: timerColor,
            transition: 'color 0.5s ease',
            animation: timeLeft <= 5 ? 'pulse 0.5s infinite' : 'none'
          }}>
            {timedOut ? "Time's up!" : `${timeLeft}s`}
          </span>
        </div>

        <div style={{
          width: '100%', height: '6px',
          background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            width: `${timerPercent}%`,
            background: timerColor,
            transition: 'width 1s linear, background 0.5s ease',
            boxShadow: `0 0 8px ${timerColor}`,
          }} />
        </div>
      </div>

      <div className="glass-card scenario-card slide-up">
        <div className="scenario-content">
          <p className="scenario-desc" style={{ marginBottom: '1.5rem', color: '#94a3b8' }}>
            {scenario.description}
          </p>
          <h2>{scenario.question}</h2>
        </div>

        <div className="scenario-options">
          {availableChoices.map((label, index) => (
            <button
              key={label}
              className="option-btn"
              onClick={() => handleChoice(label)}
              disabled={submitting}
              style={{ borderLeft: `3px solid ${CHOICE_COLORS[index]}` }}
            >
              <span style={{ color: CHOICE_COLORS[index], fontWeight: 'bold', marginRight: '0.5rem' }}>
                {label}.
              </span>
              {scenario[`choice${label}`].text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayScenario;
