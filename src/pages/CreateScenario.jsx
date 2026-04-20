import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../context/ScenarioContext';
import { useAuth } from '../context/AuthContext';

const emptyChoice = () => ({ text: '', score: 0 });

const CreateScenario = () => {
  const navigate = useNavigate();
  const { createCustomScenario: createScenario } = useScenario();
  const { currentUser } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [question, setQuestion] = useState('');
  const [explanation, setExplanation] = useState('');

  
  const [choices, setChoices] = useState([
    { text: '', score: 10 },
    { text: '', score: -5 },
  ]);

  const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

  const updateChoice = (index, field, value) => {
    setChoices(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addChoice = () => {
    if (choices.length < 4) setChoices(prev => [...prev, emptyChoice()]);
  };

  const removeChoice = (index) => {
    if (choices.length > 2) setChoices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');


    for (let i = 0; i < choices.length; i++) {
      if (!choices[i].text.trim()) {
        setError(`Choice ${CHOICE_LABELS[i]} text cannot be empty.`);
        return;
      }
    }

    setLoading(true);
    try {
  
      const choiceFields = {};
      CHOICE_LABELS.slice(0, choices.length).forEach((label, i) => {
        choiceFields[`choice${label}`] = {
          text: choices[i].text,
          score: Number(choices[i].score)
        };
      });

      const newScenario = {
        title,
        description,
        question,
        explanation,          
        choiceCount: choices.length,
        ...choiceFields,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
      };

      await createScenario(newScenario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container fade-in">
      <div className="glass-card create-card">
        <h2>Create Community Scenario</h2>
        <p>Post a scenario for the community to vote on. Add up to 4 choices.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Title</label>
            <input required type="text" className="form-input" value={title}
              onChange={e => setTitle(e.target.value)} placeholder="e.g. The Ethics Dilemma" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea required className="form-input" value={description}
              onChange={e => setDescription(e.target.value)} placeholder="Brief context about the scenario..." />
          </div>

          <div className="form-group">
            <label>Question / Decision Point</label>
            <textarea required className="form-input" value={question}
              onChange={e => setQuestion(e.target.value)} placeholder="What should the person do?" />
          </div>

          <div className="form-group">
            <label>Explanation / Recommended Approach <span style={{ color: '#64748b', fontWeight: 'normal' }}>(shown after voting)</span></label>
            <textarea className="form-input" value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Explain which choice is best and why... (optional)" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Choices</h3>
            {choices.length < 4 && (
              <button type="button" onClick={addChoice} style={{
                background: 'transparent', border: '1px solid #6366f1',
                color: '#6366f1', borderRadius: '6px', padding: '4px 12px',
                cursor: 'pointer', fontSize: '0.85rem'
              }}>
                + Add Choice {CHOICE_LABELS[choices.length]}
              </button>
            )}
          </div>

          <div className="choices-row" style={{ flexDirection: 'column', gap: '1rem' }}>
            {choices.map((choice, index) => (
              <div key={index} className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0 }}>Choice {CHOICE_LABELS[index]}</h4>
                  {index >= 2 && (
                    <button type="button" onClick={() => removeChoice(index)} style={{
                      background: 'transparent', border: '1px solid #ef4444',
                      color: '#ef4444', borderRadius: '6px', padding: '2px 8px',
                      cursor: 'pointer', fontSize: '0.75rem'
                    }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 3, margin: 0 }}>
                    <label>Text</label>
                    <input required type="text" className="form-input" value={choice.text}
                      onChange={e => updateChoice(index, 'text', e.target.value)}
                      placeholder={`Option ${CHOICE_LABELS[index]} text`} />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label>Score</label>
                    <input required type="number" className="form-input" value={choice.score}
                      onChange={e => updateChoice(index, 'score', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            💡 Higher score = better choice. The choice with the highest score will be shown as the recommended answer after voting.
          </p>

          <div className="card-actions create-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Post Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScenario;
