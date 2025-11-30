import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, BookOpen } from 'lucide-react';

interface Deck {
  id: string;
  name: string;
  description: string;
  created_at: string;
  cardCount?: number;
  dueCount?: number;
}

interface DeckListProps {
  onSelectDeck: (deckId: string) => void;
}

export const DeckList = ({ onSelectDeck }: DeckListProps) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadDecks();
  }, [user]);

  const loadDecks = async () => {
    if (!user) return;

    try {
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (decksError) throw decksError;

      const decksWithCounts = await Promise.all(
        (decksData || []).map(async (deck) => {
          const { count: cardCount } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

          const { count: dueCount } = await supabase
            .from('card_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lte('next_review', new Date().toISOString())
            .in(
              'card_id',
              (await supabase.from('cards').select('id').eq('deck_id', deck.id)).data?.map((c) => c.id) || []
            );

          return { ...deck, cardCount: cardCount || 0, dueCount: dueCount || 0 };
        })
      );

      setDecks(decksWithCounts);
    } catch (error) {
      console.error('Ошибка загрузки колод:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    try {
      if (editingDeck) {
        const { error } = await supabase
          .from('decks')
          .update({ name: name.trim(), description: description.trim() })
          .eq('id', editingDeck.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('decks')
          .insert({ user_id: user.id, name: name.trim(), description: description.trim() });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingDeck(null);
      setName('');
      setDescription('');
      loadDecks();
    } catch (error) {
      console.error('Ошибка сохранения колоды:', error);
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту колоду? Все карточки будут удалены.')) return;

    try {
      const { error } = await supabase.from('decks').delete().eq('id', deckId);
      if (error) throw error;
      loadDecks();
    } catch (error) {
      console.error('Ошибка удаления колоды:', error);
    }
  };

  const openModal = (deck?: Deck) => {
    if (deck) {
      setEditingDeck(deck);
      setName(deck.name);
      setDescription(deck.description);
    } else {
      setEditingDeck(null);
      setName('');
      setDescription('');
    }
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Мои колоды</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} />
          Создать колоду
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет колод</h3>
          <p className="text-gray-600 mb-4">Создайте свою первую колоду для начала обучения</p>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Создать колоду
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{deck.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{deck.description || 'Без описания'}</p>

              <div className="flex gap-4 mb-4 text-sm">
                <div className="text-gray-600">
                  Карточек: <span className="font-semibold text-gray-900">{deck.cardCount}</span>
                </div>
                {deck.dueCount! > 0 && (
                  <div className="text-blue-600">
                    К изучению: <span className="font-semibold">{deck.dueCount}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectDeck(deck.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                >
                  Открыть
                </button>
                <button
                  onClick={() => openModal(deck)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(deck.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingDeck ? 'Редактировать колоду' : 'Новая колода'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Английский язык"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Слова для изучения английского языка"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDeck(null);
                  setName('');
                  setDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingDeck ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
