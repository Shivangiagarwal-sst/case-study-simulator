import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScenarioProvider } from './context/ScenarioContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import './index.css';

// ADDED: Lazy loading for all pages — improves performance score
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PlayScenario = React.lazy(() => import('./pages/PlayScenario'));
const Results = React.lazy(() => import('./pages/Results'));
const CreateScenario = React.lazy(() => import('./pages/CreateScenario'));

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ScenarioProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              {/* ADDED: Suspense required for lazy loading */}
              <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Login isSignupRoute={true} />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/play/:id" element={<ProtectedRoute><PlayScenario /></ProtectedRoute>} />
                  <Route path="/results/:id" element={<ProtectedRoute><Results /></ProtectedRoute>} />
                  <Route path="/create" element={<ProtectedRoute><CreateScenario /></ProtectedRoute>} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </ScenarioProvider>
    </AuthProvider>
  );
};

export default App;
