import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Calendar, TrendingUp, Award } from 'lucide-react';

interface Stats {
  totalCards: number;
  totalDecks: number;
  cardsStudiedToday: number;
  totalReviews: number;
  averageEasiness: number;
  streak: number;
}

interface DeckStats {
  name: string;
  cardCount: number;
  dueCount: number;
}

export const Statistics = () => {
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    totalDecks: 0,
    cardsStudiedToday: 0,
    totalReviews: 0,
    averageEasiness: 0,
    streak: 0,
  });
  const [deckStats, setDeckStats] = useState<DeckStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStatistics();
  }, [user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      const { count: totalDecks } = await supabase
        .from('decks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: totalCards } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: cardsStudiedToday } = await supabase
        .from('review_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', today.toISOString());

      const { count: totalReviews } = await supabase
        .from('review_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: reviewData } = await supabase
        .from('card_reviews')
        .select('easiness_factor')
        .eq('user_id', user.id);

      const averageEasiness =
        reviewData && reviewData.length > 0
          ? reviewData.reduce((sum, r) => sum + r.easiness_factor, 0) / reviewData.length
          : 0;

      const { data: historyData } = await supabase
        .from('review_history')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .order('reviewed_at', { ascending: false });

      let streak = 0;
      if (historyData && historyData.length > 0) {
        const dates = new Set<string>();
        historyData.forEach((h) => {
          const date = new Date(h.reviewed_at);
          dates.add(date.toISOString().split('T')[0]);
        });

        const sortedDates = Array.from(dates).sort().reverse();
        const today = new Date().toISOString().split('T')[0];

        if (sortedDates[0] === today || sortedDates[0] === getPreviousDate(today)) {
          streak = 1;
          let currentDate = sortedDates[0];

          for (let i = 1; i < sortedDates.length; i++) {
            const expectedDate = getPreviousDate(currentDate);
            if (sortedDates[i] === expectedDate) {
              streak++;
              currentDate = sortedDates[i];
            } else {
              break;
            }
          }
        }
      }

      const { data: decksData } = await supabase
        .from('decks')
        .select('id, name')
        .eq('user_id', user.id);

      const deckStatsData = await Promise.all(
        (decksData || []).map(async (deck) => {
          const { count: cardCount } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

          const { data: cardIds } = await supabase
            .from('cards')
            .select('id')
            .eq('deck_id', deck.id);

          const ids = (cardIds || []).map((c) => c.id);
          const { count: dueCount } =
            ids.length > 0
              ? await supabase
                  .from('card_reviews')
                  .select('*', { count: 'exact', head: true })
                  .in('card_id', ids)
                  .lte('next_review', new Date().toISOString())
              : { count: 0 };

          return {
            name: deck.name,
            cardCount: cardCount || 0,
            dueCount: dueCount || 0,
          };
        })
      );

      setStats({
        totalCards: totalCards || 0,
        totalDecks: totalDecks || 0,
        cardsStudiedToday: cardsStudiedToday || 0,
        totalReviews: totalReviews || 0,
        averageEasiness: Number(averageEasiness.toFixed(2)),
        streak,
      });

      setDeckStats(deckStatsData);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviousDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Статистика</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCards}</div>
              <div className="text-sm text-gray-600">Всего карточек</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.cardsStudiedToday}</div>
              <div className="text-sm text-gray-600">Изучено сегодня</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Всего повторений</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Award size={24} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
              <div className="text-sm text-gray-600">Дней подряд</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Общая информация</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Колод</span>
              <span className="font-semibold text-gray-900">{stats.totalDecks}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-600">Средний фактор легкости</span>
              <span className="font-semibold text-gray-900">{stats.averageEasiness}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Всего повторений</span>
              <span className="font-semibold text-gray-900">{stats.totalReviews}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика по колодам</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {deckStats.length === 0 ? (
              <p className="text-gray-500 text-sm">Нет колод</p>
            ) : (
              deckStats.map((deck, index) => (
                <div key={index} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="font-medium text-gray-900 mb-1">{deck.name}</div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Карточек: {deck.cardCount}</span>
                    {deck.dueCount > 0 && (
                      <span className="text-blue-600">К изучению: {deck.dueCount}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          💡 Алгоритм SuperMemo-2 (SM-2)
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          Платформа использует проверенный алгоритм интервального повторения SM-2. Он автоматически
          определяет оптимальное время для повторения каждой карточки на основе вашей оценки
          качества запоминания. Чем лучше вы помните материал, тем больше интервал до следующего
          повторения. Это помогает эффективно переводить информацию в долговременную память.
        </p>
      </div>
    </div>
  );
};
