-- ΣIM · Acceso sin correo con códigos de clase, sesiones y límites de intentos.
-- Nunca almacenar códigos en claro. Aplicar en la base D1 correspondiente antes del deploy.
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  code_digest TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  session_digest TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student','admin')),
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
  actor_digest TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
