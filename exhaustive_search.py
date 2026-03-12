import sqlite3
import os

db_path = r"c:\Scripts_SBCD\Supabase\oris_api.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT * FROM funcionarios LIMIT 1")
desc = [d[0] for d in cur.description]

search_val = "2045"
for col in desc:
    cur.execute(f"SELECT Id, Nome, {col} FROM funcionarios WHERE CAST({col} AS TEXT) LIKE ?", (f"%{search_val}%",))
    res = cur.fetchall()
    if res:
        print(f"Match in column '{col}': {res}")

conn.close()
