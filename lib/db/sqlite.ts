import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const defaultPath = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "abode.db")
const directory = path.dirname(defaultPath)

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true })
}

const db = new Database(defaultPath)
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pipeline_tasks (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  step_order INTEGER NOT NULL DEFAULT 0,
  resource_tier TEXT NOT NULL DEFAULT 'cpu',
  requires_approval INTEGER NOT NULL DEFAULT 0,
  agent_id TEXT,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_org ON pipelines(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_tasks_pipeline ON pipeline_tasks(pipeline_id, step_order);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL,
  org_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_org_timestamp ON audit_events(org_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  author TEXT NOT NULL,
  rating REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dag_runs (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  status TEXT NOT NULL,
  next_step TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  metadata TEXT,
  triggered_by TEXT,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dag_run_tasks (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  pipeline_task_id TEXT,
  name TEXT NOT NULL,
  resource_tier TEXT NOT NULL DEFAULT 'cpu',
  requires_approval INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  agent_id TEXT,
  FOREIGN KEY (run_id) REFERENCES dag_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_task_id) REFERENCES pipeline_tasks(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_dag_runs_org ON dag_runs(org_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dag_runs_pipeline ON dag_runs(pipeline_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dag_run_tasks_run ON dag_run_tasks(run_id, last_updated DESC);
`)

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!columns.some((col) => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

ensureColumn("pipeline_tasks", "resource_tier", "TEXT NOT NULL DEFAULT 'cpu'")
ensureColumn("pipeline_tasks", "requires_approval", "INTEGER NOT NULL DEFAULT 0")
ensureColumn("pipeline_tasks", "agent_id", "TEXT")

ensureColumn("dag_run_tasks", "agent_id", "TEXT")

export { db }
