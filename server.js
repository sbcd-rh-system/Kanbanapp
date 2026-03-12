import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const db = new Database(join(__dirname, 'db', 'kanban.db'));

// Inicializar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL,
    sectors TEXT NOT NULL,
    id_oris TEXT,
    cpf TEXT,
    matricula_esocial TEXT,
    cargo TEXT,
    dt_admissao TEXT,
    lotacao TEXT,
    situacao TEXT,
    linkedin_url TEXT,
    linkedin_photo TEXT
  );

  CREATE TABLE IF NOT EXISTS tarefas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    sectorId TEXT NOT NULL,
    assignedTo TEXT, -- JSON
    isPrivate INTEGER, -- 0 ou 1
    createdBy TEXT,
    createdAt TEXT NOT NULL,
    dueDate TEXT,
    tags TEXT, -- JSON
    connections TEXT, -- JSON
    points INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    projectId TEXT
  );

  CREATE TABLE IF NOT EXISTS projetos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sectorId TEXT NOT NULL,
    color TEXT,
    createdAt TEXT NOT NULL,
    createdBy TEXT
  );
`);

// Migração manual simples para colunas novas
try { db.exec("ALTER TABLE tarefas ADD COLUMN points INTEGER DEFAULT 0;"); } catch (e) { }
try { db.exec("ALTER TABLE tarefas ADD COLUMN priority TEXT DEFAULT 'medium';"); } catch (e) { }
try { db.exec("ALTER TABLE tarefas ADD COLUMN projectId TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE usuarios ADD COLUMN linkedin_url TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE usuarios ADD COLUMN linkedin_photo TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE projetos ADD COLUMN createdBy TEXT;"); } catch (e) { }

// Rota para buscar usuários
app.get('/api/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM usuarios').all();
        const parsedUsers = users.map(u => ({
            ...u,
            sectors: JSON.parse(u.sectors)
        }));
        res.json(parsedUsers);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para salvar/atualizar usuário
app.post('/api/users', (req, res) => {
    try {
        const { id, name, email, password, avatar, role, sectors, id_oris, cpf, matricula_esocial, cargo, dt_admissao, lotacao, situacao, linkedin_url, linkedin_photo } = req.body;

        const stmt = db.prepare(`
      INSERT OR REPLACE INTO usuarios (id, name, email, password, avatar, role, sectors, id_oris, cpf, matricula_esocial, cargo, dt_admissao, lotacao, situacao, linkedin_url, linkedin_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(id, name, email, password || 'demo123', avatar, role, JSON.stringify(sectors), id_oris, cpf, matricula_esocial, cargo, dt_admissao, lotacao, situacao, linkedin_url, linkedin_photo);
        res.status(201).json({ message: 'Usuário salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para deletar usuário
app.delete('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ROTAS DE PROJETOS ---

app.get('/api/projects', (req, res) => {
    try {
        const { sectorId } = req.query;
        let query = 'SELECT * FROM projetos';
        let params = [];
        if (sectorId) {
            query += ' WHERE sectorId = ?';
            params.push(sectorId);
        }
        query += ' ORDER BY name COLLATE NOCASE ASC';
        const projects = db.prepare(query).all(...params);
        res.json(projects);
    } catch (error) {
        console.error('Erro ao buscar projetos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', (req, res) => {
    try {
        const { id, name, description, sectorId, color, createdAt, createdBy } = req.body;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO projetos (id, name, description, sectorId, color, createdAt, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, name, description, sectorId, color, createdAt || new Date().toISOString(), createdBy);
        res.status(201).json({ message: 'Projeto salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM projetos WHERE id = ?').run(id);
        // Opcional: Desvincular tarefas ou deletá-las
        db.prepare('UPDATE tarefas SET projectId = NULL WHERE projectId = ?').run(id);
        res.json({ message: 'Projeto removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ROTAS DE TAREFAS ---

// Buscar todas as tarefas
app.get('/api/tasks', (req, res) => {
    try {
        const tasks = db.prepare('SELECT * FROM tarefas').all();
        const parsedTasks = tasks.map(t => ({
            ...t,
            isPrivate: Boolean(t.isPrivate),
            assignedTo: JSON.parse(t.assignedTo || '[]'),
            tags: JSON.parse(t.tags || '[]'),
            connections: JSON.parse(t.connections || '[]'),
            points: Number(t.points || 0),
            priority: t.priority || 'medium'
        }));
        res.json(parsedTasks);
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Salvar/Atualizar tarefa
app.post('/api/tasks', (req, res) => {
    try {
        const {
            id, title, description, status, sectorId,
            assignedTo, isPrivate, createdBy, createdAt,
            dueDate, tags, connections, points, priority, projectId
        } = req.body;

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO tarefas (
                id, title, description, status, sectorId,
                assignedTo, isPrivate, createdBy, createdAt,
                dueDate, tags, connections, points, priority, projectId
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id, title, description, status, sectorId,
            JSON.stringify(assignedTo || []),
            isPrivate ? 1 : 0,
            createdBy,
            createdAt || new Date().toISOString(),
            dueDate,
            JSON.stringify(tags || []),
            JSON.stringify(connections || []),
            points || 0,
            priority || 'medium',
            projectId
        );

        res.status(201).json({ message: 'Tarefa salva com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        res.status(500).json({ error: error.message });
    }
});

// Deletar tarefa
app.delete('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM tarefas WHERE id = ?').run(id);
        res.json({ message: 'Tarefa removida com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy Oris API
app.get('/api/oris/obterFuncionario', async (req, res) => {
    const { id } = req.query;
    const baseUrl = process.env.VITE_ORIS_BASE_URL;
    const username = process.env.VITE_ORIS_USERNAME;
    const password = process.env.VITE_ORIS_PASSWORD;

    if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

    const url = `${baseUrl}/json/funcionarios/obterFuncionario?id=${id}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64'),
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Erro no proxy Oris:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to parse Oris Date (same as frontend)
function parseOrisDate(orisDate) {
    if (!orisDate) return '';
    const match = orisDate.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
    if (match) {
        const date = new Date(parseInt(match[1]));
        return date.toLocaleDateString('pt-BR');
    }
    return orisDate;
}

// Sync users with Oris API
app.post('/api/users/sync-oris', async (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM usuarios WHERE id_oris IS NOT NULL').all();
        let updatedCount = 0;

        const username = process.env.VITE_ORIS_USERNAME;
        const password = process.env.VITE_ORIS_PASSWORD;
        const authHeader = 'Basic ' + Buffer.from(username + ":" + password).toString('base64');

        for (const user of users) {
            try {
                const response = await fetch(`${process.env.VITE_ORIS_BASE_URL || 'https://portal.orisrh.com:9878/apiV1'}/json/funcionarios/obterFuncionario?id=${user.id_oris}`, {
                    headers: {
                        'Authorization': authHeader,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) continue;

                const employee = await response.json();
                if (employee) {
                    const dt_admissao_formatted = parseOrisDate(employee.Admissao);

                    db.prepare(`
                        UPDATE usuarios SET 
                            cargo = ?, 
                            lotacao = ?, 
                            situacao = ?,
                            dt_admissao = ?
                        WHERE id = ?
                    `).run(
                        employee.Cargo,
                        employee.Lotacao,
                        employee.Situacao,
                        dt_admissao_formatted,
                        user.id
                    );
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Erro ao sincronizar usuario ${user.name}:`, err.message);
            }
        }
        res.json({ success: true, updated: updatedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Background Sync Task (runs every 1 hour)
setInterval(async () => {
    console.log('[SYNC] Iniciando sincronização automática com Oris...');
    try {
        const response = await fetch(`http://localhost:${port}/api/users/sync-oris`, {
            method: 'POST'
        });
        const data = await response.json();
        console.log(`[SYNC] Concluído. Usuarios atualizados: ${data.updated}`);
    } catch (err) {
        console.error('[SYNC] Erro na sincronização automática:', err.message);
    }
}, 1000 * 60 * 60);

// Proxy de avatar do LinkedIn via unavatar.io
// Resolve o problema de CORS ao fazer a requisição no servidor
app.get('/api/linkedin-avatar', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username é obrigatório' });
    }

    const attempts = [
        `https://unavatar.io/linkedin/${username}?fallback=false`,
        `https://unavatar.io/github/${username}?fallback=false`,
    ];

    for (const url of attempts) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://unavatar.io/',
                },
                redirect: 'follow',
            });

            if (!response.ok) continue;

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            // Checar se é realmente uma imagem (não um redirect para página de erro)
            if (!contentType.startsWith('image/')) continue;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Imagens muito pequenas (<2KB) costumam ser placeholders/erros
            if (buffer.length < 2000) continue;

            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=86400'); // cache por 24h
            return res.send(buffer);
        } catch (err) {
            console.warn(`[Avatar Proxy] Falha em ${url}:`, err.message);
        }
    }

    // Nenhuma fonte funcionou
    return res.status(404).json({ error: 'Avatar não encontrado' });
});

app.listen(port, () => {

    console.log(`\n🚀 Backend Kanban rodando em http://localhost:${port}`);
    console.log(`📁 Banco de dados: ${join(__dirname, 'db', 'kanban.db')}\n`);
});
