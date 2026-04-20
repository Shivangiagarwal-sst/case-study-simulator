import { useState, useEffect, useCallback } from 'react';
import { getScenarios, createScenario, deleteScenario } from '../services/firestoreService';
import localScenariosData from '../data/scenarios.json';

// CUSTOM HOOK: encapsulates all scenario fetching and management logic
// This keeps ScenarioContext clean and demonstrates custom hook usage
const useScenarios = (currentUser) => {
  const [allScenarios, setAllScenarios] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchScenarios = useCallback(async () => {
    if (!currentUser) {
      setAllScenarios([]);
      return;
    }
    setLoading(true);
    try {
      let fetched = await getScenarios();
      if (fetched.length === 0) {
        for (const scenario of localScenariosData) {
          await createScenario(scenario);
        }
        fetched = await getScenarios();
      }
      setAllScenarios(fetched);
    } catch (err) {
      console.error('Failed to load scenarios', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const addScenario = useCallback(async (scenarioData) => {
    await createScenario(scenarioData);
    const updated = await getScenarios();
    setAllScenarios(updated);
  }, []);

  const removeScenario = useCallback(async (scenarioId) => {
    await deleteScenario(scenarioId);
    setAllScenarios(prev => prev.filter(s => s.id !== scenarioId));
  }, []);

  return { allScenarios, loading, addScenario, removeScenario };
};

export default useScenarios;
