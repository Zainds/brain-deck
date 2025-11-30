import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateSM2, getQualityDescription } from '../utils/sm2';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface Card {
  id: string;
  front: string;
  back: string;
}

interface CardReview {
  id: string;
  card_id: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
}

interface StudySessionProps {
  deckId: string;
  onBack: () => void;
}

export const StudySession = ({ deckId, onBack }: StudySessionProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [reviews, setReviews] = useState<Map<string, CardReview>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadStudySession();
  }, [deckId, user]);

  const loadStudySession = async () => {
    if (!user) return;

    try {
      const { data: deck } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      if (deck) setDeckName(deck.name);

      const { data: cardsData } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId);

      if (!cardsData || cardsData.length === 0) {
        setLoading(false);
        return;
      }

      const cardIds = cardsData.map((c) => c.id);
      const { data: reviewsData } = await supabase
        .from('card_reviews')
        .select('*')
        .in('card_id', cardIds)
        .lte('next_review', new Date().toISOString());

      const dueCards = cardsData.filter((card) =>
        reviewsData?.some((review) => review.card_id === card.id)
      );

      setCards(dueCards);

      const reviewsMap = new Map<string, CardReview>();
      reviewsData?.forEach((review) => {
        reviewsMap.set(review.card_id, review);
      });
      setReviews(reviewsMap);

      if (dueCards.length === 0) {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки сессии:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuality = async (quality: number) => {
    if (!user || currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];
    const currentReview = reviews.get(currentCard.id);

    if (!currentReview) return;

    const sm2Result = calculateSM2(
      quality,
      currentReview.repetitions,
      currentReview.easiness_factor,
      currentReview.interval
    );

    try {
      await supabase
        .from('card_reviews')
        .update({
          easiness_factor: sm2Result.easinessFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          next_review: sm2Result.nextReview.toISOString(),
          last_review: new Date().toISOString(),
        })
        .eq('id', currentReview.id);

      await supabase.from('review_history').insert({
        card_id: currentCard.id,
        user_id: user.id,
        quality: quality,
      });

      if (currentIndex + 1 >= cards.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {cards.length === 0 ? 'Нет карточек для повторения' : 'Сессия завершена!'}
          </h2>
          <p className="text-gray-600 mb-8">
            {cards.length === 0
              ? 'Все карточки в этой колоде изучены. Возвращайтесь позже.'
              : 'Отличная работа! Вы повторили все карточки на сегодня.'}
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition font-medium"
          >
            Вернуться к колодам
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
          Назад
        </button>
        <div className="text-sm font-medium text-gray-600">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            {showAnswer ? 'Ответ' : 'Вопрос'}
          </h3>
          <div className="text-2xl font-medium text-gray-900 mb-8 min-h-[100px] flex items-center justify-center">
            {showAnswer ? currentCard.back : currentCard.front}
          </div>
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition font-medium text-lg"
          >
            Показать ответ
          </button>
        ) : (
          <div>
            <p className="text-center text-sm font-medium text-gray-700 mb-4">
              Насколько хорошо вы помните?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3, 4, 5].map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQuality(quality)}
                  className={`p-4 rounded-xl border-2 transition hover:border-blue-500 hover:bg-blue-50 text-left ${
                    quality < 3
                      ? 'border-red-200 hover:border-red-500 hover:bg-red-50'
                      : quality === 3
                      ? 'border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50'
                      : 'border-green-200 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">{quality}</div>
                  <div className="text-xs text-gray-600">{getQualityDescription(quality)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <RotateCcw size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Система интервального повторения:</strong> Оценки 0-2 сбросят прогресс
            карточки. Оценки 3-5 увеличат интервал до следующего повторения.
          </div>
        </div>
      </div>
    </div>
  );
};
