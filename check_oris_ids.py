import sqlite3
import os

db_path = r"c:\Scripts_SBCD\Supabase\oris_api.db"
if not os.path.exists(db_path):
    print(f"File not found: {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT Id, Nome, Registro, CPF FROM funcionarios LIMIT 10")
    rows = cur.fetchall()
    print("Id | Nome | Registro | CPF")
    for row in rows:
        print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}")
    conn.close()
