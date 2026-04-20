import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveUserProgress, getUserProgress } from '../services/firestoreService';
import useScenarios from '../hooks/useScenarios';

const ScenarioContext = createContext();
export const useScenario = () => useContext(ScenarioContext);

export const ScenarioProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const { allScenarios, loading: scenariosLoading, addScenario, removeScenario } = useScenarios(currentUser);

  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentScenario = useMemo(() => {
    if (!currentScenarioId) return null;
    return allScenarios.find(s => s.id === currentScenarioId) || null;
  }, [currentScenarioId, allScenarios]);

  const currentStep = useMemo(() => {
    if (!currentScenario || currentStepIndex === null || currentStepIndex === undefined) return null;
    return currentScenario.steps?.[currentStepIndex] || null;
  }, [currentScenario, currentStepIndex]);

  const isFinished = currentStepIndex === null;

  const saveProgress = async (scenarioId, stepIndex, currentScore, currentHistory) => {
    if (!currentUser) return;
    try {
      await saveUserProgress(currentUser.uid, scenarioId, {
        stepIndex, score: currentScore, history: currentHistory
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const startScenario = useCallback(async (scenarioId) => {
    setCurrentScenarioId(scenarioId);
    setCurrentStepIndex(0);
    setScore(0);
    setHistory([]);
    await saveProgress(scenarioId, 0, 0, []);
  }, [currentUser]);

  const selectOption = useCallback(async (choice) => {
    if (!currentStep) return;
    const stepRecord = {
      question: currentStep.question,
      choiceText: choice.text,
      scoreImpact: choice.scoreImpact
    };
    const newHistory = [...history, stepRecord];
    const newScore = score + choice.scoreImpact;
    const nextIndex = choice.nextStepIndex ?? null;
    setHistory(newHistory);
    setScore(newScore);
    setCurrentStepIndex(nextIndex);
    await saveProgress(currentScenarioId, nextIndex, newScore, newHistory);
  }, [currentScenarioId, currentStep, history, score, currentUser]);

  const restart = useCallback(async () => {
    await startScenario(currentScenarioId);
  }, [startScenario, currentScenarioId]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    let loaded = false;
    if (!currentUser) { setLoading(false); return false; }
    try {
      const data = await getUserProgress(currentUser.uid);
      if (data) {
        setCurrentScenarioId(data.currentScenarioId);
        setCurrentStepIndex(data.history?.stepIndex ?? 0);
        setScore(data.history?.score || 0);
        setHistory(data.history?.history || []);
        loaded = true;
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    setLoading(false);
    return loaded;
  }, [currentUser]);

  const createCustomScenario = async (scenarioData) => {
    if (!currentUser) throw new Error('Must be logged in to create scenarios');
    await addScenario({ ...scenarioData, createdBy: currentUser.uid });
  };

  const deleteOwnScenario = async (scenarioId) => {
    if (!currentUser) throw new Error('Must be logged in');
    await removeScenario(scenarioId);
  };

  const communityScenarios = useMemo(
    () => allScenarios.filter(s => s.createdBy !== currentUser?.uid),
    [allScenarios, currentUser]
  );


  const myScenarios = useMemo(
    () => allScenarios.filter(s => s.createdBy === currentUser?.uid),
    [allScenarios, currentUser]
  );

  
  const rootScenarios = useMemo(() => allScenarios, [allScenarios]);

  const value = {
    currentScenario, currentStep, currentStepIndex, isFinished,
    score, history, startScenario, selectOption, restart,
    loadProgress, loading: loading || scenariosLoading,
    rootScenarios, communityScenarios, myScenarios,
    createCustomScenario, deleteOwnScenario
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
};
