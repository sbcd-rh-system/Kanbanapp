import sqlite3
import json
import os

db_path = r"c:\Users\mandy\OneDrive - SOCIEDADE BRASILEIRA CAMINHO DE DAMASCO\Apps\Kanbanapp\db\kanban.db"

def init_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Criar tabela de usuários
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        role TEXT NOT NULL,
        sectors TEXT NOT NULL, -- Armazenado como JSON string
        id_oris TEXT,
        cpf TEXT,
        matricula_esocial TEXT,
        cargo TEXT,
        dt_admissao TEXT,
        lotacao TEXT,
        situacao TEXT
    )
    ''')
    
    # Dados dos mocks
    users = [
        {
            'id': '1',
            'name': 'Admin Amanda',
            'email': 'admin@empresa.com',
            'password': 'demo123',
            'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
            'role': 'admin',
            'sectors': ['recruitment', 'compensation', 'dho', 'training', 'dp'],
        },
        {
            'id': '2',
            'name': 'Josué',
            'email': 'maria@empresa.com',
            'password': 'demo123',
            'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
            'role': 'admin',
            'sectors': ['recruitment'],
        },
        {
            'id': '3',
            'name': 'João Oliveira',
            'email': 'joao@empresa.com',
            'password': 'demo123',
            'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
            'role': 'user',
            'sectors': ['compensation', 'dho'],
        },
        {
            'id': '4',
            'name': 'Ana Costa',
            'email': 'ana@empresa.com',
            'password': 'demo123',
            'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
            'role': 'user',
            'sectors': ['training', 'dp'],
        },
    ]
    
    for user in users:
        cursor.execute('''
        INSERT OR REPLACE INTO usuarios (id, name, email, password, avatar, role, sectors)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user['id'],
            user['name'],
            user['email'],
            user['password'],
            user['avatar'],
            user['role'],
            json.dumps(user['sectors'])
        ))
    
    conn.commit()
    conn.close()
    print(f"Banco de dados criado com sucesso em: {db_path}")

if __name__ == "__main__":
    init_db()
