-- Identidad persistente por estudiante y proyectos aislados por clase.
-- El código temporal de clase sigue siendo la puerta de entrada, no el propietario de datos.
CREATE TABLE IF NOT EXISTS students (
 id TEXT PRIMARY KEY,
 class_id TEXT NOT NULL REFERENCES classes(id),
 alias TEXT NOT NULL,
 alias_key TEXT NOT NULL,
 secret_digest TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 UNIQUE(class_id,alias_key)
);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
ALTER TABLE sessions ADD COLUMN student_id TEXT REFERENCES students(id);
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,
 class_id TEXT NOT NULL REFERENCES classes(id),
 student_id TEXT NOT NULL REFERENCES students(id),
 title TEXT NOT NULL,
 graph_json TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(class_id,student_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_class ON projects(class_id,updated_at DESC);
