import sqlite3
import json

conn = sqlite3.connect(r'db/kanban.db')
cur = conn.cursor()

# 1. Localiza Josué
cur.execute("SELECT id, name FROM usuarios WHERE name LIKE '%JOSUE%' OR name LIKE '%JOSUÉ%'")
results = cur.fetchall()

if not results:
    print("Josué não encontrado no banco.")
else:
    for josue_id, name in results:
        # 2. Atualiza para admin (que é o nível master no sistema atual) e dá todos os setores
        cur.execute("SELECT sectors FROM usuarios WHERE id = ?", (josue_id,))
        # Garante que ele tenha acesso a todos os setores ativos
        all_sectors = ['recruitment', 'compensation', 'dho', 'dp', 'data']
        
        cur.execute(
            "UPDATE usuarios SET role = 'admin', sectors = ? WHERE id = ?",
            (json.dumps(all_sectors), josue_id)
        )
        print(f"Josué ({name}) atualizado para Administrador Master (Global) com todos os setores.")

conn.commit()
conn.close()
