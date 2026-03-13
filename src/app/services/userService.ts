import { User } from '../types';

const API_URL = '/api/users';

export const userService = {
    async listUsers(): Promise<User[]> {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Falha ao buscar usuários');
        return response.json();
    },

    async saveUser(user: User): Promise<void> {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error('Falha ao salvar usuário');
    },

    async deleteUser(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao remover usuário');
    },

};
