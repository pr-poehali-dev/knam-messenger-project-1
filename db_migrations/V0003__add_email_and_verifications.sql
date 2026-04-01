-- Добавляем email в таблицу users
ALTER TABLE t_p38819024_knam_messenger_proje.users
  ADD COLUMN IF NOT EXISTS email character varying(255) NULL;

-- Уникальный индекс на email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON t_p38819024_knam_messenger_proje.users(email)
  WHERE email IS NOT NULL;

-- Таблица для хранения кодов верификации email
CREATE TABLE IF NOT EXISTS t_p38819024_knam_messenger_proje.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email character varying(255) NOT NULL,
  code character varying(10) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false
);

-- Индекс для быстрого поиска по email
CREATE INDEX IF NOT EXISTS email_verifications_email_idx
  ON t_p38819024_knam_messenger_proje.email_verifications(email);
