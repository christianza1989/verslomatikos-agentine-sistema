import sqlite3

db_path = r"C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\data\reputation.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS accounting_invoices (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_code TEXT NOT NULL,
    seller_address TEXT,
    seller_phone TEXT,
    seller_email TEXT,
    seller_iban TEXT,
    seller_bank TEXT,
    client_name TEXT NOT NULL,
    client_company TEXT,
    client_code TEXT,
    client_email TEXT NOT NULL,
    service_title TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'issued', -- issued, sent, paid
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(case_id) REFERENCES accounting_cases(id)
);
""")

# Also add agent_state and next_step column to accounting_cases if not exists
try:
    cursor.execute("ALTER TABLE accounting_cases ADD COLUMN waiting_for TEXT DEFAULT 'client_reply';")
except Exception:
    pass

try:
    cursor.execute("ALTER TABLE accounting_cases ADD COLUMN invoice_id TEXT;")
except Exception:
    pass

conn.commit()
print("Accounting invoices table created and cases columns updated.")
conn.close()
