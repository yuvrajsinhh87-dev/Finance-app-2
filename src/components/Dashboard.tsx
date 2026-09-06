import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, CreditCard, Activity, Wallet, PieChart as PieChartIcon, Plus, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchApi } from '../lib/api.js';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext.js';

export function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [budgetLoading, setBudgetLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const [txs, accs, bdgts] = await Promise.all([
          fetchApi('/transactions'),
          fetchApi('/accounts'),
          fetchApi(`/budgets?month=${currentMonth}`)
        ]);
        setTransactions(txs);
        setAccounts(accs);
        setBudgets(bdgts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const { totalBalance, income, expense, thisMonthTxs } = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    
    const now = new Date();
    const thisMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { totalBalance, income, expense, thisMonthTxs };
  }, [accounts, transactions]);

  const expenseBreakdown = useMemo(() => {
    const expenses = thisMonthTxs.filter(t => t.type === 'expense');
    const breakdown = expenses.reduce((acc: any, curr) => {
      const name = curr.merchant || 'Other';
      if (!acc[name]) acc[name] = 0;
      acc[name] += parseFloat(curr.amount);
      return acc;
    }, {});
    
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [thisMonthTxs]);

  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = thisMonthTxs
        .filter(t => t.type === 'expense' && (t.merchant || 'Other') === b.category)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const limit = parseFloat(b.limit);
      const percentage = Math.min(100, Math.max(0, (spent / limit) * 100));
      return { ...b, spent, percentage, limit };
    });
  }, [budgets, thisMonthTxs]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory || !newBudgetLimit) return;
    setBudgetLoading(true);
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const saved = await fetchApi('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: newBudgetCategory.trim(),
          limit: newBudgetLimit.trim(),
          month: currentMonth
        })
      });
      setBudgets(prev => {
        const existing = prev.findIndex(p => p.id === saved.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setShowBudgetForm(false);
      setNewBudgetCategory('');
      setNewBudgetLimit('');
    } catch (err) {
      console.error(err);
    } finally {
      setBudgetLoading(false);
    }
  };

  const isDark = theme === 'dark';
  // Use our new earthy colors for the pie chart
  const COLORS = ['#597E52', '#9A7352', '#A3BCA1', '#D4B89A', '#6B726B'];
  const tooltipBg = isDark ? '#262B26' : '#FFFFFF';
  const tooltipBorder = isDark ? '#3A423A' : '#E0E5E0';
  const tooltipText = isDark ? '#F0F4F0' : '#2D332D';

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-semibold mb-2">Overview</h2>
        <p className="text-text-muted">Welcome back. Here is your financial summary.</p>
      </motion.div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Total Balance" value={totalBalance} icon={<CreditCard size={20} />} trend="+2.4% this month" className="text-accent-secondary" wrapperClassName="bg-accent-secondary/10 border-accent-secondary/20" />
        <Card title="Monthly Income" value={income} icon={<TrendingUp size={20} />} className="text-accent-primary" wrapperClassName="bg-accent-primary/10 border-accent-primary/20" />
        <Card title="Monthly Expenses" value={expense} icon={<TrendingDown size={20} />} className="text-danger" wrapperClassName="bg-danger/10 border-danger/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Transactions */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Recent Transactions</h3>
              <button className="text-accent-secondary text-sm font-medium hover:underline">View All</button>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-text-muted">No transactions yet</div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-hover rounded-xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-positive/10 text-positive' : 'bg-danger/10 text-danger'
                      }`}>
                        {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-text-main">{tx.merchant || (tx.type === 'income' ? 'Income' : 'Expense')}</p>
                        <p className="text-xs text-text-muted">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${tx.type === 'income' ? 'text-positive' : 'text-text-main'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Budgets */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Monthly Budgets</h3>
              <button 
                onClick={() => setShowBudgetForm(!showBudgetForm)}
                className="text-accent-secondary text-sm font-medium flex items-center gap-1 hover:bg-hover px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} /> Set Budget
              </button>
            </div>

            {showBudgetForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-hover rounded-xl border border-border"
                onSubmit={handleSaveBudget}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Groceries"
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      value={newBudgetCategory}
                      onChange={e => setNewBudgetCategory(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Monthly Limit (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      value={newBudgetLimit}
                      onChange={e => setNewBudgetLimit(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowBudgetForm(false)} className="px-4 py-2 text-sm text-text-muted hover:bg-border rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={budgetLoading} className="px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50">Save Budget</button>
                </div>
              </motion.form>
            )}

            {budgetProgress.length === 0 && !showBudgetForm ? (
              <div className="text-center py-10 text-text-muted">
                <Target className="mx-auto mb-3 opacity-20" size={48} />
                <p>No budgets set for this month</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgetProgress.map(budget => (
                  <div key={budget.id}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-medium text-text-main">{budget.category}</p>
                        <p className="text-xs text-text-muted">₹{budget.spent.toLocaleString('en-IN')} spent of ₹{budget.limit.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${budget.percentage >= 100 ? 'text-danger' : budget.percentage >= 80 ? 'text-warning' : 'text-positive'}`}>
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${budget.percentage}%` }}
                        className={`h-full ${budget.percentage >= 100 ? 'bg-danger' : budget.percentage >= 80 ? 'bg-warning' : 'bg-positive'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Expense Breakdown */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-6">Top Expenses</h3>
            {expenseBreakdown.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-sm">No expenses this month</div>
            ) : (
              <div>
                <div className="h-[200px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                        itemStyle={{ color: tooltipText }}
                        formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {expenseBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-text-muted">{item.name}</span>
                      </div>
                      <span className="font-medium text-text-main">
                        ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accounts Summary */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-medium mb-6">Your Accounts</h3>
            {accounts.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-sm">No accounts added</div>
            ) : (
              <div className="space-y-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-border flex items-center justify-center text-text-muted">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{acc.name}</p>
                        <p className="text-xs text-text-muted">{acc.type}</p>
                      </div>
                    </div>
                    <p className="font-medium">₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, className = "", wrapperClassName = "", trend }: { title: string, value: number, icon: React.ReactNode, className?: string, wrapperClassName?: string, trend?: string }) {
  return (
    <div className={`rounded-2xl p-6 border shadow-sm ${wrapperClassName || 'bg-surface border-border'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        <div className={`text-text-muted ${className}`}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold mb-2">
        ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
      {trend && <p className="text-xs text-text-muted">{trend}</p>}
    </div>
  );
}
