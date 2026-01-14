import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Estates from './pages/Estates';
import Commissions from './pages/Commissions';
import Installments from './pages/Installments';
import WhatsAppCRM from './pages/WhatsAppCRM';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/estates" element={<Estates />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/installments" element={<Installments />} />
          <Route path="/whatsapp" element={<WhatsAppCRM />} />
          <Route path="/settings" element={
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
              <p className="text-gray-500">System configuration and user access controls.</p>
              <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                Role-based access control and system audit logs are restricted to Super Admins.
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;