import sqlite3
import os

db_path = r"C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\data\reputation.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Create tables for accounting audits and dialogs
cursor.execute("""
CREATE TABLE IF NOT EXISTS accounting_cases (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    company_name TEXT,
    company_code TEXT,
    company_type TEXT DEFAULT 'MB', -- MB, UAB, etc.
    status TEXT DEFAULT 'new', -- new, contacted, documents_requested, documents_received, analyzing, review_ready, approved, completed
    annual_turnover REAL,
    issues_found INTEGER DEFAULT 0,
    summary_notes TEXT,
    accountant_feedback TEXT,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS accounting_messages (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'outbound' or 'inbound'
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body_text TEXT,
    has_attachments INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES accounting_cases(id)
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS accounting_documents (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT, -- 'trial_balance', 'bank_statement', 'invoice', 'other'
    file_path TEXT NOT NULL,
    file_size INTEGER,
    parsed_data JSON,
    analysis_findings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES accounting_cases(id)
);
""")

conn.commit()
print("Accounting database tables created successfully.")

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", [r[0] for r in cursor.fetchall()])
conn.close()
