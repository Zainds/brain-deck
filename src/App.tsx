import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Landing } from './components/Landing';
import { ArrowLeft } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return showLogin ? (
    <div className="relative">
      <button 
        onClick={() => setShowLogin(false)}
        className="absolute top-6 left-6 z-10 p-2 text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white rounded-full transition-all"
        aria-label="Назад к лендингу"
      >
        <ArrowLeft size={24} />
      </button>
      <Auth />
    </div>
  ) : (
    <Landing onLogin={() => setShowLogin(true)} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
