import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { fetchApi } from '../lib/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext.js';

export function Reports() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const txs = await fetchApi('/transactions');
        setTransactions(txs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const { chartData, categoryData, totalExpense } = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    const chartData = daysInMonth.map(day => {
      const dayTxs = transactions.filter(t => 
        t.type === 'expense' && isSameDay(parseISO(t.date), day)
      );
      const total = dayTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return {
        date: format(day, 'MMM d'),
        amount: total
      };
    });

    const totalExpense = chartData.reduce((sum, d) => sum + d.amount, 0);

    const expensesThisMonth = transactions.filter(t => {
      const d = parseISO(t.date);
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const categoryBreakdown = expensesThisMonth.reduce((acc, curr) => {
      const cat = curr.category || curr.merchant || 'Other';
      acc[cat] = (acc[cat] || 0) + parseFloat(curr.amount);
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryBreakdown)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);

    return { chartData, categoryData, totalExpense };
  }, [transactions]);

  if (loading) return <div className="p-8">Loading reports...</div>;

  const isDark = theme === 'dark';
  const tooltipCursor = isDark ? '#3A423A' : '#F0ECE7';
  const tooltipBg = isDark ? '#262B26' : '#FFFFFF';
  const tooltipBorder = isDark ? '#3A423A' : '#E0E5E0';
  const tooltipText = isDark ? '#F0F4F0' : '#2D332D';
  const barEmpty = isDark ? '#3A423A' : '#EEF2EE';
  const PIE_COLORS = ['#597E52', '#9A7352', '#A3BCA1', '#D4B89A', '#6B726B', '#D32F2F', '#FF9800'];

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Reports & Analytics</h2>
        <p className="text-text-muted">Visualize your spending and income trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-medium mb-1">Monthly Spending</h3>
            <p className="text-3xl font-semibold mb-8">₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={20}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: tooltipCursor }}
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                    itemStyle={{ color: tooltipText }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {
                      chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#9A7352' : barEmpty} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-6">Expenses by Category</h3>
            {categoryData.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-sm">No expenses this month</div>
            ) : (
              <div>
                <div className="h-[220px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                        itemStyle={{ color: tooltipText }}
                        formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
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

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Export Data</h3>
            <p className="text-sm text-text-muted mb-6">Download your transactions for external analysis in CSV format.</p>
            <button className="w-full py-3 px-4 bg-primary border border-border hover:border-text-muted text-text-main font-medium rounded-xl transition-colors">
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
