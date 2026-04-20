import { db } from '../firebase';
import { collection, addDoc, getDocs, setDoc, doc, getDoc, deleteDoc, query, where, increment, updateDoc } from 'firebase/firestore';

// FIX: Removed top-level `const scenariosCollection = collection(db, 'scenarios')`.
// That line ran at module import time. If db wasn't fully ready, it crashed silently
// and caused the dashboard to go blank after signup. Now collection() is called
// inside each function, which is safe and lazy.

// Scenarios Collection
export const createScenario = async (data) => {
  if (data.id) {
    await setDoc(doc(db, 'scenarios', data.id), data);
    return data.id;
  } else {
    const docRef = await addDoc(collection(db, 'scenarios'), data);
    return docRef.id;
  }
};

export const getScenarios = async () => {
  const snapshot = await getDocs(collection(db, 'scenarios'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getScenarioById = async (scenarioId) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const deleteScenario = async (scenarioId) => {
  await deleteDoc(doc(db, 'scenarios', scenarioId));
};

// User Progress Collection
export const saveUserProgress = async (userId, scenarioId, progress) => {
  const progressRef = doc(db, 'userProgress', userId);
  await setDoc(progressRef, {
    currentScenarioId: scenarioId,
    history: progress,
    updatedAt: new Date().toISOString()
  });
};

export const getUserProgress = async (userId) => {
  const progressRef = doc(db, 'userProgress', userId);
  const docSnap = await getDoc(progressRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

// Responses Collection
export const saveResponse = async (scenarioId, userId, choiceKey, pointsEarned = 0) => {
  const responseRef = doc(db, 'responses', `${scenarioId}_${userId}`);
  await setDoc(responseRef, {
    scenarioId,
    userId,
    choice: choiceKey,
    pointsEarned,
    answeredAt: new Date().toISOString()
  });

  const pointsRef = doc(db, 'userPoints', userId);
  const pointsSnap = await getDoc(pointsRef);
  if (pointsSnap.exists()) {
    await updateDoc(pointsRef, { totalPoints: increment(pointsEarned) });
  } else {
    await setDoc(pointsRef, { userId, totalPoints: pointsEarned });
  }
};

export const getUserResponse = async (scenarioId, userId) => {
  const responseRef = doc(db, 'responses', `${scenarioId}_${userId}`);
  const docSnap = await getDoc(responseRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const getResponses = async (scenarioId) => {
  const responsesCollection = collection(db, 'responses');
  const q = query(responsesCollection, where('scenarioId', '==', scenarioId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const getResponseCount = async (scenarioId) => {
  const responsesCollection = collection(db, 'responses');
  const q = query(responsesCollection, where('scenarioId', '==', scenarioId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Points Collection
export const getUserTotalPoints = async (userId) => {
  const pointsRef = doc(db, 'userPoints', userId);
  const docSnap = await getDoc(pointsRef);
  if (docSnap.exists()) {
    return docSnap.data().totalPoints ?? 0;
  }
  return 0;
};
