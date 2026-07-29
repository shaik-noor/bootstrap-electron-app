import { app } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'
import type { AppSettings } from '../../shared/types'

/**
 * All SQLite persistence for the app. Static class — call DatabaseService.foo(), never new.
 * Follows the MyDesk pattern: idempotent init(), migrations in checkAndMigrate().
 *
 * Add new tables here:
 *   1. Add a raw CREATE TABLE IF NOT EXISTS in init()
 *   2. Add any schema changes as guarded steps in checkAndMigrate()
 *   3. Add save/load static methods below
 */
export class DatabaseService {
  private static sqlite: Database.Database | null = null

  private static get db(): Database.Database {
    if (!DatabaseService.sqlite) throw new Error('DatabaseService not initialised')
    return DatabaseService.sqlite
  }

  static async init(): Promise<void> {
    const dbDir = path.join(app.getPath('userData'), 'storage')
    const fs = await import('fs')
    fs.mkdirSync(dbDir, { recursive: true })

    const dbPath = path.join(dbDir, 'app.db')
    DatabaseService.sqlite = new Database(dbPath)
    DatabaseService.sqlite.pragma('journal_mode = WAL')
    DatabaseService.sqlite.pragma('foreign_keys = ON')

    DatabaseService.createTables()
    DatabaseService.checkAndMigrate()
  }

  private static createTables(): void {
    DatabaseService.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Add your own tables here, e.g.:
      -- CREATE TABLE IF NOT EXISTS items (
      --   id         TEXT PRIMARY KEY,
      --   title      TEXT NOT NULL DEFAULT '',
      --   content    TEXT NOT NULL DEFAULT '',
      --   created_at TEXT NOT NULL,
      --   updated_at TEXT NOT NULL
      -- );
    `)
  }

  private static checkAndMigrate(): void {
    // Add numbered migration steps here as the schema evolves.
    // Each step is guarded so it runs exactly once on upgrade, never on fresh install.
    // Example:
    // const cols = DatabaseService.db.pragma('table_info(items)') as { name: string }[]
    // if (!cols.some(c => c.name === 'tags')) {
    //   try { DatabaseService.db.exec("ALTER TABLE items ADD COLUMN tags TEXT") } catch {}
    // }
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  static saveSettings(partial: Partial<AppSettings>): void {
    const existing = DatabaseService.loadSettings()
    const merged = { ...existing, ...partial }
    DatabaseService.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('app_settings', JSON.stringify(merged))
  }

  static loadSettings(): AppSettings {
    const row = DatabaseService.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('app_settings') as { value: string } | undefined
    if (!row) return {}
    try {
      return JSON.parse(row.value) as AppSettings
    } catch {
      return {}
    }
  }
}
