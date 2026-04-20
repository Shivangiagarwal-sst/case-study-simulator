import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../context/ScenarioContext';
import { useAuth } from '../context/AuthContext';
import { getResponseCount } from '../services/firestoreService';

const Dashboard = () => {
  const { communityScenarios, myScenarios, deleteOwnScenario, loading } = useScenario();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('community');
  const [deletingId, setDeletingId] = useState(null);
  const [responseCounts, setResponseCounts] = useState({});

  const isCommunity = activeTab === 'community';
  const scenarios = isCommunity ? communityScenarios : myScenarios;

  useEffect(() => {
    if (scenarios.length === 0) return;
    scenarios.forEach(async (s) => {
      if (responseCounts[s.id] !== undefined) return;
      const count = await getResponseCount(s.id);
      setResponseCounts(prev => ({ ...prev, [s.id]: count }));
    });
  }, [scenarios]);

  const handleDelete = async (e, scenarioId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scenario? This cannot be undone.')) return;
    setDeletingId(scenarioId);
    try {
      await deleteOwnScenario(scenarioId);
    } catch (err) {
      alert('Failed to delete scenario');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading-spinner">Loading scenarios...</div>;

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <h1>{isCommunity ? 'Community Scenarios' : 'My Scenarios'}</h1>
        <p className="dashboard-desc">
          {isCommunity
            ? 'Make decisions. See what the community chose.'
            : 'Scenarios you have created. Others can play these.'}
        </p>
        {currentUser && (
          <button className="btn-primary create-btn" onClick={() => navigate('/create')}>
            + Create Scenario
          </button>
        )}
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'community', label: '🌐 Community', count: communityScenarios.length },
          { key: 'mine',      label: '📁 My Scenarios', count: myScenarios.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              background: activeTab === tab.key ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: '0.4rem',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              borderRadius: '99px',
              padding: '1px 8px',
              fontSize: '0.78rem'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      {scenarios.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          {isCommunity ? (
            <>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No community scenarios yet.</p>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Create one and others will be able to play it!</p>
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/create')}>
                + Create Scenario
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>You haven't created any scenarios yet.</p>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Create one — the community will answer it!</p>
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/create')}>
                + Create First Scenario
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="scenario-grid">
          {scenarios.map((scenario) => {
            const count = responseCounts[scenario.id];
            return (
              <div key={scenario.id} className="glass-card scenario-overview-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ flex: 1 }}>{scenario.title}</h2>
                  {!isCommunity && (
                    <button
                      onClick={(e) => handleDelete(e, scenario.id)}
                      disabled={deletingId === scenario.id}
                      style={{
                        background: 'transparent', border: '1px solid #ef4444',
                        color: '#ef4444', borderRadius: '6px', padding: '4px 10px',
                        cursor: 'pointer', fontSize: '0.75rem', marginLeft: '1rem', flexShrink: 0
                      }}
                    >
                      {deletingId === scenario.id ? '...' : 'Delete'}
                    </button>
                  )}
                </div>

                <p style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                  {isCommunity ? `By: ${scenario.createdByEmail || 'Community'}` : '👤 Created by you'}
                </p>

                <p>{scenario.description}</p>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{
                    fontSize: '0.78rem',
                    color: count > 0 ? '#6ee7b7' : '#64748b',
                    background: count > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${count > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '99px',
                    padding: '2px 10px',
                  }}>
                    {count === undefined
                      ? '...'
                      : count === 0
                        ? 'No responses yet'
                        : `👥 ${count} ${count === 1 ? 'response' : 'responses'}`}
                  </span>
                </div>

                <div className="card-actions">
                  {isCommunity ? (
                    <button className="btn-primary" onClick={() => navigate(`/play/${scenario.id}`)}>
                      Play Scenario
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/results/${scenario.id}`)}
                      style={{
                        background: 'rgba(99,102,241,0.15)', border: '1px solid #6366f1',
                        color: '#a5b4fc', padding: '0.5rem 1rem', borderRadius: '8px',
                        cursor: 'pointer', fontSize: '0.9rem',
                      }}
                    >
                      📊 View Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
