import { Home, List, CreditCard, PieChart, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

export function Navigation({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const { logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: List },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-accent-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <span className="text-accent-primary font-bold">F</span>
          </div>
          Finance
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-accent-primary/10 text-accent-primary' 
                  : 'text-text-muted hover:text-text-main hover:bg-hover'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-text-muted hover:text-text-main hover:bg-hover"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={logOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
