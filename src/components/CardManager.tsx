import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, ArrowLeft, Play } from 'lucide-react';

interface Card {
  id: string;
  front: string;
  back: string;
  created_at: string;
}

interface CardManagerProps {
  deckId: string;
  onBack: () => void;
  onStartStudy: () => void;
}

export const CardManager = ({ deckId, onBack, onStartStudy }: CardManagerProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [dueCount, setDueCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    loadDeckData();
  }, [deckId, user]);

  const loadDeckData = async () => {
    if (!user) return;

    try {
      const { data: deck } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      if (deck) setDeckName(deck.name);

      const { data: cardsData, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(cardsData || []);

      const cardIds = (cardsData || []).map((c) => c.id);
      if (cardIds.length > 0) {
        const { count } = await supabase
          .from('card_reviews')
          .select('*', { count: 'exact', head: true })
          .in('card_id', cardIds)
          .lte('next_review', new Date().toISOString());

        setDueCount(count || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !front.trim() || !back.trim()) return;

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('cards')
          .update({ front: front.trim(), back: back.trim() })
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        const { data: newCard, error } = await supabase
          .from('cards')
          .insert({
            deck_id: deckId,
            user_id: user.id,
            front: front.trim(),
            back: back.trim(),
          })
          .select()
          .single();

        if (error) throw error;

        if (newCard) {
          await supabase.from('card_reviews').insert({
            card_id: newCard.id,
            user_id: user.id,
            easiness_factor: 2.5,
            interval: 0,
            repetitions: 0,
            next_review: new Date().toISOString(),
          });
        }
      }

      setShowModal(false);
      setEditingCard(null);
      setFront('');
      setBack('');
      loadDeckData();
    } catch (error) {
      console.error('Ошибка сохранения карточки:', error);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Удалить эту карточку?')) return;

    try {
      const { error } = await supabase.from('cards').delete().eq('id', cardId);
      if (error) throw error;
      loadDeckData();
    } catch (error) {
      console.error('Ошибка удаления карточки:', error);
    }
  };

  const openModal = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setFront(card.front);
      setBack(card.back);
    } else {
      setEditingCard(null);
      setFront('');
      setBack('');
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{deckName}</h2>
            <p className="text-sm text-gray-600">Карточек: {cards.length}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <button
              onClick={onStartStudy}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Play size={20} />
              Учить ({dueCount})
            </button>
          )}
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Добавить карточку
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет карточек</h3>
          <p className="text-gray-600 mb-4">Добавьте карточки для начала обучения</p>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Добавить карточку
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Вопрос</div>
                <div className="text-gray-900 font-medium line-clamp-3">{card.front}</div>
              </div>
              <div className="mb-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Ответ</div>
                <div className="text-gray-700 line-clamp-3">{card.back}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(card)}
                  className="flex-1 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit2 size={18} className="mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="flex-1 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} className="mx-auto" />
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
              {editingCard ? 'Редактировать карточку' : 'Новая карточка'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вопрос (лицевая сторона)
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Например: Hello"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ответ (обратная сторона)
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Например: Привет"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCard(null);
                  setFront('');
                  setBack('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!front.trim() || !back.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCard ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
