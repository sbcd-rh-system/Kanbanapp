import sqlite3
import json

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# 1. Atualizar usuários (coluna sectors)
cur.execute("SELECT id, sectors FROM usuarios")
users = cur.fetchall()
for user_id, sectors_json in users:
    try:
        sectors = json.loads(sectors_json)
        if 'benefits' in sectors:
            new_sectors = ['dp' if s == 'benefits' else s for s in sectors]
            cur.execute("UPDATE usuarios SET sectors = ? WHERE id = ?", (json.dumps(new_sectors), user_id))
            print(f"Usuário {user_id} atualizado: benefits -> dp")
    except Exception as e:
        print(f"Erro ao processar usuário {user_id}: {e}")

# 2. Atualizar tarefas (a tabela se chama 'tarefas' no server.js)
try:
    cur.execute("UPDATE tarefas SET sectorId = 'dp' WHERE sectorId = 'benefits'")
    print(f"Tarefas atualizadas: {cur.rowcount}")
except sqlite3.OperationalError as e:
    print(f"Erro ao atualizar tarefas: {e}")

# 3. Atualizar Roles Hierárquicos (admin-benefits -> admin-dp, user-benefits -> user-dp)
cur.execute("UPDATE usuarios SET role = 'admin-dp' WHERE role = 'admin-benefits'")
cur.execute("UPDATE usuarios SET role = 'user-dp' WHERE role = 'user-benefits'")
print("Roles hierárquicos atualizados.")

conn.commit()
conn.close()
