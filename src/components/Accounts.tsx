import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Wallet, Building2, Banknote, CreditCard as CreditCardIcon, Landmark } from 'lucide-react';
import { fetchApi } from '../lib/api.js';

export function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await fetchApi('/accounts');
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      institution: formData.get('institution'),
      balance: formData.get('balance'),
      currency: formData.get('currency'),
    };
    
    try {
      await fetchApi('/accounts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setShowAdd(false);
      loadAccounts();
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'bank': return <Landmark size={24} />;
      case 'wallet': return <Wallet size={24} />;
      case 'credit': return <CreditCardIcon size={24} />;
      default: return <Banknote size={24} />;
    }
  }

  const getColorStyles = (type: string) => {
    switch(type) {
      case 'bank': return 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary';
      case 'wallet': return 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary';
      case 'credit': return 'bg-danger/10 border-danger/30 text-danger';
      default: return 'bg-surface border-border text-text-main';
    }
  }

  if (loading) return <div className="p-8">Loading accounts...</div>;

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-semibold mb-2">Accounts</h2>
          <p className="text-text-muted">Manage your bank accounts, wallets, and cash.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-accent-primary text-primary px-4 py-2 rounded-xl font-medium hover:bg-accent-primary/90 transition"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const typeStyle = getColorStyles(acc.type);
          return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={acc.id} 
            className={`rounded-2xl p-6 shadow-sm flex flex-col justify-between h-48 border ${typeStyle.split(' text-')[0] || 'bg-surface border-border'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${typeStyle.replace(/bg-.*\/10/, 'bg-black/20')}`}>
                  {getIcon(acc.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-text-main">{acc.name}</h3>
                  <p className="text-sm text-text-muted flex items-center gap-1">
                    {acc.institution && <Building2 size={12} />}
                    {acc.institution || acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-text-muted mb-1">Available Balance</p>
              <p className="text-3xl font-semibold">₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </motion.div>
          )
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-6">Add New Account</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Account Name</label>
                <input required name="name" type="text" placeholder="e.g. HDFC Salary" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Type</label>
                  <select name="type" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary">
                    <option value="bank">Bank Account</option>
                    <option value="wallet">Wallet</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Institution</label>
                  <input name="institution" type="text" placeholder="e.g. HDFC" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Initial Balance (INR)</label>
                <input required name="balance" type="number" step="0.01" defaultValue="0" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary" />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-border transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent-primary text-primary font-medium hover:bg-accent-primary/90 transition">
                  Save Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
