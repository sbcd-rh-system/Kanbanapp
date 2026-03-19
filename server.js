import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializar Supabase de Funcionários (Oris Sync)
const employeesUrl = process.env.SUPABASE_EMPLOYEES_URL;
const employeesKey = process.env.SUPABASE_EMPLOYEES_KEY;
const supabaseEmployees = (employeesUrl && employeesKey) 
    ? createClient(employeesUrl, employeesKey)
    : null;

// Rota para buscar usuários
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuarios').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para salvar/atualizar usuário
app.post('/api/users', async (req, res) => {
    try {
        const userData = req.body;
        const { data, error } = await supabase
            .from('usuarios')
            .upsert(userData)
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Usuário salvo com sucesso', data });
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para deletar usuário
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ROTAS DE PROJETOS ---

app.get('/api/projects', async (req, res) => {
    try {
        const { sectorId } = req.query;
        let query = supabase.from('projetos').select('*').order('name', { ascending: true });
        
        if (sectorId) {
            query = query.eq('sectorId', sectorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar projetos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const projectData = {
            ...req.body,
            createdAt: req.body.createdAt || new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('projetos')
            .upsert(projectData)
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Projeto salvo com sucesso', data });
    } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Em paralelo: deletar projeto e atualizar tarefas
        const [projRes, taskRes] = await Promise.all([
            supabase.from('projetos').delete().eq('id', id),
            supabase.from('tarefas').update({ projectId: null }).eq('projectId', id)
        ]);

        if (projRes.error) throw projRes.error;
        if (taskRes.error) throw taskRes.error;

        res.json({ message: 'Projeto removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ROTAS DE TAREFAS ---

app.get('/api/tasks', async (req, res) => {
    try {
        const { data, error } = await supabase.from('tarefas').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            createdAt: req.body.createdAt || new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('tarefas')
            .upsert(taskData)
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Tarefa salva com sucesso', data });
    } catch (error) {
        console.error('Erro ao salvar tarefa:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('tarefas').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Tarefa removida com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- ROTAS DO BANCO DE FUNCIONÁRIOS (ORIS SYNC) ---

app.get('/api/employees/search', async (req, res) => {
    if (!supabaseEmployees) return res.status(503).json({ error: 'Serviço de funcionários não configurado' });
    
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const isNumeric = !isNaN(q);
        let queryBuilder = supabaseEmployees
            .from('oris_funcionarios')
            .select('*');
            //.eq('situacao', '01-ATIVO');
        
        if (isNumeric) {
            queryBuilder = queryBuilder.or(`id.eq.${q},nome.ilike.%${q}%,cpf.eq.${q},registro.eq.${q}`);
        } else {
            queryBuilder = queryBuilder.ilike('nome', `%${q}%`);
        }

        const { data, error } = await queryBuilder.limit(10);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/employees/:id', async (req, res) => {
    if (!supabaseEmployees) return res.status(503).json({ error: 'Serviço de funcionários não configurado' });

    const { id } = req.params;
    try {
        const { data, error } = await supabaseEmployees
            .from('oris_funcionarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao obter funcionário:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- FIM DAS ROTAS DE DADOS ---

// Proxy de avatar do LinkedIn
app.get('/api/linkedin-avatar', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username é obrigatório' });

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
            if (!contentType.startsWith('image/')) continue;
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length < 2000) continue;
            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(buffer);
        } catch (err) {
            console.warn(`[Avatar Proxy] Falha em ${url}:`, err.message);
        }
    }
    return res.status(404).json({ error: 'Avatar não encontrado' });
});

app.listen(port, () => {
    console.log(`\n🚀 Backend Kanban migrado para SUPABASE rodando em http://localhost:${port}\n`);
});

export default app;
