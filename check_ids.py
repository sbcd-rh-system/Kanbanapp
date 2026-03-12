import sqlite3
import os

db_path = r"c:\Scripts_SBCD\Supabase\oris_api.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT Id, Nome FROM funcionarios LIMIT 5")
rows = cur.fetchall()
for row in rows:
    print(f"ID: {row[0]} | Nome: {row[1]}")
conn.close()
