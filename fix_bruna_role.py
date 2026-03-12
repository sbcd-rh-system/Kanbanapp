import sqlite3

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# Atualiza Bruna para admin-dho
cur.execute(
    "UPDATE usuarios SET role = 'admin-dho' WHERE name LIKE '%BRUNA%'"
)
print(f"Linhas atualizadas: {cur.rowcount}")

conn.commit()

# Verifica resultado
cur.execute("SELECT name, role FROM usuarios WHERE name LIKE '%BRUNA%'")
print(f"Novo estado: {cur.fetchone()}")

conn.close()
