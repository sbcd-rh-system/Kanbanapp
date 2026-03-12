import sqlite3
import os

db_path = r"c:\Scripts_SBCD\Supabase\oris_api.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
# Search for 2045 in any numeric-looking column that could be a registration
cur.execute("SELECT Id, Nome, CPF FROM funcionarios WHERE Id=2045 OR Nome LIKE '%2045%'")
rows = cur.fetchall()
if rows:
    for row in rows:
        print(f"Found match: {row}")
else:
    print("No match found for 2045 in Id or Nome")

# Also check if there's any column like 'Registro' or 'Matricula' in the actual table (re-checking PRAGMA)
cur.execute("PRAGMA table_info(funcionarios)")
cols = [c[1] for c in cur.fetchall()]
print(f"Columns: {cols}")

conn.close()
