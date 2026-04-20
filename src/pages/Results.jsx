import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScenarioById, getResponses, getUserResponse, getUserTotalPoints } from '../services/firestoreService';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

const Results = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [choiceStats, setChoiceStats] = useState([]);
  const [userChoice, setUserChoice] = useState(null);
  const [bestChoice, setBestChoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const scenarioData = await getScenarioById(id);
        if (!scenarioData) { setError('Scenario not found'); setLoading(false); return; }
        setScenario(scenarioData);

        const [responses, uResponse] = await Promise.all([
          getResponses(id),
          getUserResponse(id, currentUser.uid),
        ]);

        if (uResponse) setUserChoice(uResponse.choice);

        const choiceCount = scenarioData.choiceCount || 2;
        const labels = CHOICE_LABELS.slice(0, choiceCount).filter(
          label => scenarioData[`choice${label}`]
        );

        const total = responses.length;
        const rawStats = labels.map((label) => ({
          label,
          text: scenarioData[`choice${label}`]?.text || '',
          score: scenarioData[`choice${label}`]?.score ?? 0,
          count: responses.filter(r => r.choice === label).length,
          percent: total === 0 ? 0 : Math.round((responses.filter(r => r.choice === label).length / total) * 100),
        }));

        const best = [...rawStats].sort((a, b) => b.score - a.score)[0];

        const userChoiceLabel = uResponse?.choice;
        const stats = rawStats.map((stat) => ({
          ...stat,
          color: stat.label === best.label
            ? '#10b981'
            : stat.label === userChoiceLabel
              ? '#f43f5e'
              : '#64748b',
        }));

        setChoiceStats(stats);
        setBestChoice(best);

      } catch (err) {
        console.error(err);
        setError('Error loading results');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [id, currentUser]);

  if (loading) return <div className="loading-spinner">Loading results...</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!scenario) return null;

  const total = choiceStats.reduce((sum, s) => sum + s.count, 0);
  const userChoiceStat = choiceStats.find(s => s.label === userChoice);
  const userWasCorrect = userChoice && bestChoice && userChoice === bestChoice.label;

  return (
    <div className="outcome-container fade-in">
      <div className="glass-card outcome-card">
        <h2>Community Results</h2>
        <h3 style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: '#94a3b8' }}>{scenario.title}</h3>

        {/* Your answer banner */}
        {userChoice && (
          <div style={{
            background: userWasCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            border: `1px solid ${userWasCorrect ? '#10b981' : '#6366f1'}`,
            borderRadius: '8px', padding: '0.75rem 1rem',
            marginBottom: '1rem', fontSize: '0.9rem',
            color: userWasCorrect ? '#6ee7b7' : '#a5b4fc'
          }}>
            {userWasCorrect ? '✅' : '💡'} You chose: <strong style={{ color: '#fff' }}>{userChoiceStat?.text}</strong>
            {userWasCorrect
              ? ' — Great choice! That was the recommended answer.'
              : ' — See the recommended answer below.'}
          </div>
        )}

        {/* Recommended answer */}
        {bestChoice && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981',
            borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
          }}>
            <p style={{ color: '#6ee7b7', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
              ⭐ RECOMMENDED ANSWER — Choice {bestChoice.label} (Score: +{bestChoice.score})
            </p>
            <p style={{ color: '#fff', marginBottom: scenario.explanation ? '0.5rem' : 0 }}>
              {bestChoice.text}
            </p>
            {scenario.explanation && (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {scenario.explanation}
              </p>
            )}
          </div>
        )}

        {/* Community vote bars */}
        <div className="results-stats">
          <p style={{ textAlign: 'center', marginBottom: '1.25rem', color: '#94a3b8' }}>
            {total} {total === 1 ? 'person has' : 'people have'} responded
          </p>

          {choiceStats.map((stat) => (
            <div key={stat.label} style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                <span style={{
                  fontWeight: userChoice === stat.label ? 'bold' : 'normal',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  {userChoice === stat.label && '👉 '}
                  {bestChoice?.label === stat.label && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>⭐</span>}
                  <span style={{ color: stat.color, fontWeight: 'bold' }}>{stat.label}.</span>
                  <span style={{ color: '#e2e8f0' }}>{stat.text}</span>
                </span>
                <span style={{ fontWeight: 'bold', minWidth: '45px', textAlign: 'right' }}>{stat.percent}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stat.percent}%`, height: '100%',
                  backgroundColor: stat.color,
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
              <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                {stat.count} {stat.count === 1 ? 'vote' : 'votes'}
                {stat.score > 0 && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>+{stat.score} pts</span>}
                {stat.score < 0 && <span style={{ color: '#f43f5e', marginLeft: '0.5rem' }}>{stat.score} pts</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="card-actions">
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
