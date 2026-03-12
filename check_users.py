import sqlite3

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# Fabiana vira admin-recruitment (administradora somente do setor de recrutamento)
cur.execute(
    "UPDATE usuarios SET role = 'admin-recruitment' WHERE name LIKE '%FABIANA%'"
)
print(f"Linhas atualizadas: {cur.rowcount}")

# Estado final
cur.execute("SELECT name, role, sectors FROM usuarios ORDER BY role, name")
rows = cur.fetchall()
print("\nHierarquia atual:")
print(f"{'Nome':<45} {'Role':<25} {'Sectors'}")
print("-" * 110)
for r in rows:
    print(f"{r[0]:<45} {r[1]:<25} {r[2]}")

conn.commit()
conn.close()
