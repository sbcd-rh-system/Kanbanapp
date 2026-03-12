import sqlite3
import os

db_path = r"c:\Scripts_SBCD\Supabase\oris_api.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("PRAGMA table_info(funcionarios)")
cols = cur.fetchall()
for col in cols:
    print(col[1])
conn.close()
