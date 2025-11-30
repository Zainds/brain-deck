import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DeckList } from './DeckList';
import { CardManager } from './CardManager';
import { StudySession } from './StudySession';
import { Statistics } from './Statistics';
import { LogOut, BarChart3, BookOpen } from 'lucide-react';

type View = 'decks' | 'cards' | 'study' | 'stats';

export const Dashboard = () => {
  const [view, setView] = useState<View>('decks');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setView('cards');
  };

  const handleStartStudy = () => {
    setView('study');
  };

  const handleBackToDecks = () => {
    setView('decks');
    setSelectedDeckId(null);
  };

  const handleBackToCards = () => {
    setView('cards');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BrainDeck</h1>
                <p className="text-xs text-gray-500">Система интервального повторения</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setView('decks');
                  setSelectedDeckId(null);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  view === 'decks' || view === 'cards' || view === 'study'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Колоды</span>
              </button>

              <button
                onClick={() => setView('stats')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  view === 'stats' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={18} />
                <span className="hidden sm:inline">Статистика</span>
              </button>

              <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />

              <div className="hidden sm:flex items-center gap-3 px-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Выйти"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'decks' && <DeckList onSelectDeck={handleSelectDeck} />}
        {view === 'cards' && selectedDeckId && (
          <CardManager
            deckId={selectedDeckId}
            onBack={handleBackToDecks}
            onStartStudy={handleStartStudy}
          />
        )}
        {view === 'study' && selectedDeckId && (
          <StudySession deckId={selectedDeckId} onBack={handleBackToCards} />
        )}
        {view === 'stats' && <Statistics />}
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>Платформа адаптивного обучения с алгоритмом SuperMemo-2 (SM-2)</p>
      </footer>
    </div>
  );
};
