import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Estates from './pages/Estates';
import Commissions from './pages/Commissions';
import Installments from './pages/Installments';
import WhatsAppCRM from './pages/WhatsAppCRM';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Realtors from './pages/Realtors';
import RealtorOnboarding from './pages/RealtorOnboarding';
import Login from './pages/Login'; // Import Login

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    return localStorage.getItem('dg_session') === 'active';
  });

  const handleLogin = () => {
    localStorage.setItem('dg_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dg_session');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes - No Sidebar */}
        {/* Encrypted Shadow Routes for Public Onboarding */}
        <Route path="/register/asset-secure-px45" element={<Onboarding />} />
        <Route path="/enroll/partner-elite-vx92" element={<RealtorOnboarding />} />

        {/* Legacy Redirects */}
        <Route path="/onboarding" element={<Navigate to="/register/asset-secure-px45" replace />} />
        <Route path="/realtor-onboarding" element={<Navigate to="/enroll/partner-elite-vx92" replace />} />
        
        {/* Authentication Route */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
        } />

        {/* Protected Private Routes - With Sidebar */}
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/estates" element={<Estates />} />
                <Route path="/commissions" element={<Commissions />} />
                <Route path="/installments" element={<Installments />} />
                <Route path="/whatsapp" element={<WhatsAppCRM />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/realtors" element={<Realtors />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;