import sqlite3
import json

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# 1. Atualizar usuários (remover 'training' da lista de setores)
cur.execute("SELECT id, sectors FROM usuarios")
users = cur.fetchall()
for user_id, sectors_json in users:
    try:
        sectors = json.loads(sectors_json)
        if 'training' in sectors:
            new_sectors = [s for s in sectors if s != 'training']
            cur.execute("UPDATE usuarios SET sectors = ? WHERE id = ?", (json.dumps(new_sectors), user_id))
            print(f"Usuário {user_id}: setor 'training' removido.")
    except Exception as e:
        print(f"Erro ao processar usuário {user_id}: {e}")

# 2. Atualizar tarefas (migrar de 'training' para 'dho')
try:
    cur.execute("UPDATE tarefas SET sectorId = 'dho' WHERE sectorId = 'training'")
    print(f"Tarefas de treinamento migradas para DHO: {cur.rowcount}")
except sqlite3.OperationalError as e:
    print(f"Erro ao atualizar tarefas: {e}")

# 3. Limpar Roles Hierárquicos (se alguém era admin-training ou user-training, vira user comum para segurança)
cur.execute("UPDATE usuarios SET role = 'user' WHERE role = 'admin-training' OR role = 'user-training'")
print("Roles vinculados ao setor Treinamento foram resetados.")

conn.commit()
conn.close()
