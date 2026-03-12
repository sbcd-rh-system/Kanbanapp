import sqlite3

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# Busca Bruna
cur.execute("SELECT name, role, sectors FROM usuarios WHERE name LIKE '%BRUNA%'")
rows = cur.fetchall()
print("Usuários encontrados (BRUNA):")
for r in rows:
    print(f"Nome: {r[0]}, Role: {r[1]}, Sectors: {r[2]}")

# Lista todos para ver se ela está com outro nome ou se há erro na listagem
cur.execute("SELECT name, role, sectors FROM usuarios")
all_users = cur.fetchall()
print(f"\nTotal de usuários no banco: {len(all_users)}")

conn.close()
