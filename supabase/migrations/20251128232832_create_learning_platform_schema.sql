/*
  # Создание схемы платформы адаптивного обучения

  ## Описание
  Схема базы данных для платформы обучения с алгоритмом интервального повторения SuperMemo-2.
  Платформа позволяет пользователям создавать карточки, изучать их с оптимальными интервалами
  и отслеживать прогресс обучения.

  ## 1. Новые таблицы
  
  ### `decks` - Колоды карточек
  - `id` (uuid, primary key) - Уникальный идентификатор колоды
  - `user_id` (uuid, foreign key) - Владелец колоды
  - `name` (text) - Название колоды
  - `description` (text) - Описание колоды
  - `created_at` (timestamptz) - Дата создания
  - `updated_at` (timestamptz) - Дата обновления

  ### `cards` - Карточки для изучения
  - `id` (uuid, primary key) - Уникальный идентификатор карточки
  - `deck_id` (uuid, foreign key) - Колода, к которой принадлежит карточка
  - `user_id` (uuid, foreign key) - Владелец карточки
  - `front` (text) - Лицевая сторона (вопрос)
  - `back` (text) - Обратная сторона (ответ)
  - `created_at` (timestamptz) - Дата создания

  ### `card_reviews` - История повторений карточек (SM-2 данные)
  - `id` (uuid, primary key) - Уникальный идентификатор записи
  - `card_id` (uuid, foreign key) - Карточка
  - `user_id` (uuid, foreign key) - Пользователь
  - `easiness_factor` (numeric) - Фактор легкости (E-Factor в SM-2)
  - `interval` (integer) - Интервал повторения в днях
  - `repetitions` (integer) - Количество успешных повторений подряд
  - `next_review` (timestamptz) - Дата следующего повторения
  - `last_review` (timestamptz) - Дата последнего повторения
  - `created_at` (timestamptz) - Дата создания записи
  - `updated_at` (timestamptz) - Дата обновления

  ### `review_history` - История всех повторений
  - `id` (uuid, primary key) - Уникальный идентификатор
  - `card_id` (uuid, foreign key) - Карточка
  - `user_id` (uuid, foreign key) - Пользователь
  - `quality` (integer) - Оценка качества ответа (0-5 по SM-2)
  - `reviewed_at` (timestamptz) - Дата повторения

  ## 2. Безопасность
  - Включен RLS для всех таблиц
  - Пользователи могут работать только со своими данными
  - Политики для SELECT, INSERT, UPDATE, DELETE для аутентифицированных пользователей
*/

-- Создание таблицы колод
CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создание таблицы карточек
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Создание таблицы данных повторений (SM-2)
CREATE TABLE IF NOT EXISTS card_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  easiness_factor numeric DEFAULT 2.5,
  interval integer DEFAULT 0,
  repetitions integer DEFAULT 0,
  next_review timestamptz DEFAULT now(),
  last_review timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(card_id, user_id)
);

-- Создание таблицы истории повторений
CREATE TABLE IF NOT EXISTS review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality integer NOT NULL CHECK (quality >= 0 AND quality <= 5),
  reviewed_at timestamptz DEFAULT now()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_id ON card_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_next_review ON card_reviews(next_review);
CREATE INDEX IF NOT EXISTS idx_review_history_user_id ON review_history(user_id);
CREATE INDEX IF NOT EXISTS idx_review_history_card_id ON review_history(card_id);

-- Включение RLS для всех таблиц
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы decks
CREATE POLICY "Пользователи могут просматривать свои колоды"
  ON decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои колоды"
  ON decks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои колоды"
  ON decks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои колоды"
  ON decks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Политики для таблицы cards
CREATE POLICY "Пользователи могут просматривать свои карточки"
  ON cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои карточки"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои карточки"
  ON cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои карточки"
  ON cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Политики для таблицы card_reviews
CREATE POLICY "Пользователи могут просматривать свои данные повторений"
  ON card_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои данные повторений"
  ON card_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои данные повторений"
  ON card_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои данные повторений"
  ON card_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Политики для таблицы review_history
CREATE POLICY "Пользователи могут просматривать свою историю повторений"
  ON review_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать записи в истории повторений"
  ON review_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свою историю повторений"
  ON review_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_card_reviews_updated_at ON card_reviews;
CREATE TRIGGER update_card_reviews_updated_at
  BEFORE UPDATE ON card_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();