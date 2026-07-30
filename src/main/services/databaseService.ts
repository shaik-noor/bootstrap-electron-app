import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { app } from 'electron'
import type { AppSettings } from '../../shared/types'

let sqlite: Database.Database | null = null

function db(): Database.Database {
  if (!sqlite) throw new Error('DatabaseService not initialised')
  return sqlite
}

function createTables(): void {
  db().exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function checkAndMigrate(): void {
  // Add guarded ALTER TABLE steps here as the schema evolves.
}

export async function initDatabase(): Promise<void> {
  const dbDir = join(app.getPath('userData'), 'storage')
  mkdirSync(dbDir, { recursive: true })
  sqlite = new Database(join(dbDir, 'app.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  createTables()
  checkAndMigrate()
}

export function saveSettings(partial: Partial<AppSettings>): void {
  const existing = loadSettings()
  const merged = { ...existing, ...partial }
  db()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run('app_settings', JSON.stringify(merged))
}

export function loadSettings(): AppSettings {
  const row = db().prepare('SELECT value FROM settings WHERE key = ?').get('app_settings') as
    | { value: string }
    | undefined
  if (!row) return {}
  try {
    return JSON.parse(row.value) as AppSettings
  } catch {
    return {}
  }
}
