/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { Login } from './components/Login.js';
import { Dashboard } from './components/Dashboard.js';
import { Navigation } from './components/Navigation.js';
import { Accounts } from './components/Accounts.js';
import { Transactions } from './components/Transactions.js';
import { Reports } from './components/Reports.js';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <div className="min-h-screen bg-primary flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-primary text-text-main overflow-hidden">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'accounts' && <Accounts />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && <div className="p-8">Settings (Admin & User Config)</div>}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

