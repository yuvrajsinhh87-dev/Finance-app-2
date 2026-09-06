import { useAuth } from '../context/AuthContext.js';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';

export function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-text-main px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center bg-surface p-8 rounded-2xl border border-border shadow-xl"
      >
        <div className="w-16 h-16 bg-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mb-6">
          <Wallet size={32} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Finance Manager</h1>
        <p className="text-text-muted mb-8 text-center text-sm">
          A premium money control center. Track your spending, manage loans, and stay on budget.
        </p>
        
        <button
          onClick={signIn}
          className="w-full py-3 px-4 bg-accent-primary hover:bg-accent-primary/90 text-primary font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Sign In with Google
        </button>
      </motion.div>
    </div>
  );
}
