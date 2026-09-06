import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchApi } from '../lib/api.js';
import { format } from 'date-fns';

export function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [txs, accs] = await Promise.all([
        fetchApi('/transactions'),
        fetchApi('/accounts')
      ]);
      setTransactions(txs);
      setAccounts(accs);
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
      type: formData.get('type'),
      amount: formData.get('amount'),
      accountId: formData.get('accountId'),
      merchant: formData.get('merchant'),
      date: formData.get('date'),
      note: formData.get('note'),
    };
    
    try {
      await fetchApi('/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setShowAdd(false);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading transactions...</div>;

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-semibold mb-2">Transactions</h2>
          <p className="text-text-muted">Track and categorize your income and expenses.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-accent-primary text-primary px-4 py-2 rounded-xl font-medium hover:bg-accent-primary/90 transition"
        >
          <Plus size={20} />
          New Transaction
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" placeholder="Search transactions..." className="w-full bg-primary border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-accent-primary text-sm" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-main hover:bg-border transition">
            <Filter size={16} />
            Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-text-muted text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Details</th>
                <th className="p-4 font-medium">Account</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-text-muted">No transactions found</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border hover:bg-hover transition-colors">
                    <td className="p-4 text-sm text-text-muted">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-positive/10 text-positive' : 'bg-danger/10 text-danger'
                        }`}>
                          {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-text-main">{tx.merchant || (tx.type === 'income' ? 'Income' : 'Expense')}</p>
                          {tx.note && <p className="text-xs text-text-muted truncate max-w-[200px]">{tx.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-main">
                      {accounts.find(a => a.id === tx.accountId)?.name || 'Unknown Account'}
                    </td>
                    <td className={`p-4 font-semibold text-right ${tx.type === 'income' ? 'text-positive' : 'text-text-main'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-semibold mb-6">New Transaction</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              
              <div className="flex gap-2 p-1 bg-primary border border-border rounded-xl mb-4">
                <label className="flex-1 text-center cursor-pointer">
                  <input type="radio" name="type" value="expense" defaultChecked className="peer sr-only" />
                  <div className="py-2 rounded-lg text-sm font-medium text-text-muted peer-checked:bg-surface peer-checked:text-text-main peer-checked:shadow transition">Expense</div>
                </label>
                <label className="flex-1 text-center cursor-pointer">
                  <input type="radio" name="type" value="income" className="peer sr-only" />
                  <div className="py-2 rounded-lg text-sm font-medium text-text-muted peer-checked:bg-surface peer-checked:text-text-main peer-checked:shadow transition">Income</div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Amount (INR)</label>
                <input required name="amount" type="number" step="0.01" min="0.01" className="w-full text-2xl font-semibold bg-primary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Date</label>
                  <input required name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary" />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Account</label>
                  <select required name="accountId" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary">
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Title / Merchant</label>
                <input required name="merchant" type="text" placeholder="e.g. Amazon, Grocery, Salary" className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary" />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Note (Optional)</label>
                <textarea name="note" rows={2} className="w-full bg-primary border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-primary"></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-border transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent-primary text-primary font-medium hover:bg-accent-primary/90 transition">
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
