import { Task } from '../types';

const API_URL = '/api/tasks';

export const taskService = {
    async listTasks(): Promise<Task[]> {
        const response = await fetch(API_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Falha ao buscar tarefas');
        return response.json();
    },

    async saveTask(task: Task): Promise<void> {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!response.ok) throw new Error('Falha ao salvar tarefa');
    },

    async deleteTask(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao remover tarefa');
    },
};
