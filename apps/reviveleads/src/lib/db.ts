import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
let instance:DatabaseSync|undefined;
export function db(){if(instance)return instance;const file=path.resolve(process.env.DATABASE_PATH||'data/reviveleads.db');mkdirSync(path.dirname(file),{recursive:true});const sql=new DatabaseSync(file);sql.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',industry TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS contacts(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),name TEXT NOT NULL,phone TEXT NOT NULL,last_visit TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','replied','booked')));
CREATE TABLE IF NOT EXISTS campaigns(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),name TEXT NOT NULL,niche TEXT NOT NULL DEFAULT '',sent_count INTEGER NOT NULL DEFAULT 0,booked_count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,contact_id TEXT NOT NULL REFERENCES contacts(id),booked_time TEXT NOT NULL,calendar_id TEXT NOT NULL DEFAULT '',service_name TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);`);instance=sql;return sql;}
export function closeDb(){instance?.close();instance=undefined;}
