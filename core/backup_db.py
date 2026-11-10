"""Kasdienė ReputationPro SQLite atsarginė kopija (ROADMAP E2).

    python core/backup_db.py            # padaro kopiją dabar
Kopijos: data/operations/backups/reputation-YYYYMMDD-HHMM.db (Git ignoruoja), saugomos 30 d.
Naudoja sqlite3 backup API, todėl kopija nuosekli net kai aplikacija rašo (WAL).
Rekomendacija: kartą per savaitę nukopijuokite naujausią failą ir į debesį / išorinį diską.
"""
import datetime
import glob
import os
import sqlite3
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")
BACKUP_DIR = os.path.join(BASE_DIR, "data", "operations", "backups")
KEEP_DAYS = 30


def run_backup() -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    target = os.path.join(BACKUP_DIR, f"reputation-{datetime.datetime.now():%Y%m%d-%H%M}.db")
    src = sqlite3.connect(DB_PATH, timeout=10)
    dst = sqlite3.connect(target)
    try:
        src.backup(dst)
        ok = dst.execute("PRAGMA integrity_check").fetchone()[0]
        if ok != "ok":
            raise RuntimeError(f"Kopijos vientisumo patikra nepavyko: {ok}")
    finally:
        dst.close()
        src.close()
    cutoff = datetime.datetime.now() - datetime.timedelta(days=KEEP_DAYS)
    for old in glob.glob(os.path.join(BACKUP_DIR, "reputation-*.db")):
        if datetime.datetime.fromtimestamp(os.path.getmtime(old)) < cutoff:
            os.remove(old)
    return target


if __name__ == "__main__":
    path = run_backup()
    print(f"✅ Atsarginė kopija: {path} ({os.path.getsize(path) // 1024} KB)")
