import sqlite3
import json

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# 1. Atualizar a tabela de configurações de setores (se existir uma, mas aqui os setores são hardcoded no TS)
# No banco, temos tarefas e usuários vinculados a 'benefits'

# 2. Atualizar usuários
cur.execute("SELECT id, sectors FROM usuarios")
users = cur.fetchall()
for user_id, sectors_json in users:
    sectors = json.loads(sectors_json)
    if 'benefits' in sectors:
        new_sectors = ['dp' if s == 'benefits' else s for s in sectors]
        cur.execute("UPDATE usuarios SET sectors = ? WHERE id = ?", (json.dumps(new_sectors), user_id))
        print(f"Usuário {user_id} atualizado: benefits -> dp")

# 3. Atualizar tarefas
cur.execute("UPDATE tasks SET sectorId = 'dp' WHERE sectorId = 'benefits'")
print(f"Tarefas atualizadas: {cur.rowcount}")

# 4. Atualizar Roles Hierárquicos (admin-benefits -> admin-dp, user-benefits -> user-dp)
cur.execute("UPDATE usuarios SET role = 'admin-dp' WHERE role = 'admin-benefits'")
cur.execute("UPDATE usuarios SET role = 'user-dp' WHERE role = 'user-benefits'")
print("Roles hierárquicos atualizados.")

conn.commit()
conn.close()
