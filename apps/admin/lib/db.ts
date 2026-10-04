import Database from 'better-sqlite3';
import path from 'path';

// process.cwd() = d:\SAVJ App\apps\admin at runtime
// The shared DB lives in apps/web/savj.sqlite
const dbPath = path.resolve(process.cwd(), '..', 'web', 'savj.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
