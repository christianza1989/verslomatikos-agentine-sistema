import sqlite3

db_path = r"C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\data\reputation.db"

conn = sqlite3.connect(db_path)
c = conn.cursor()

columns = [
    ("client_phone", "TEXT"),
    ("preferred_call_time", "TEXT"),
    ("call_requested", "INTEGER DEFAULT 0"),
    ("call_briefing", "TEXT"),
    ("call_notes", "TEXT")
]

for col_name, col_type in columns:
    try:
        c.execute(f"ALTER TABLE accounting_cases ADD COLUMN {col_name} {col_type};")
        print(f"Added column {col_name}")
    except Exception as e:
        print(f"Column {col_name} already exists or error: {e}")

conn.commit()
conn.close()
print("Call management migration complete.")
