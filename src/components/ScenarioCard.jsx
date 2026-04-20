import React from 'react';
import { useScenario } from '../context/ScenarioContext';

const ScenarioCard = ({ scenario }) => {
  const { selectOption } = useScenario();

  return (
    <div className="glass-card scenario-card slide-up">
      <div className="scenario-content">
        <h2>{scenario.title}</h2>
        <p className="scenario-description">{scenario.description}</p>
      </div>
      <div className="scenario-options">
        {scenario.options && scenario.options.map((option) => (
          <button 
            key={option.id} 
            className="option-btn"
            onClick={() => selectOption(option)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScenarioCard;
