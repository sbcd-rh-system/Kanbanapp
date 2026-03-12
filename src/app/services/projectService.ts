import { Project } from '../types';

const API_URL = '/api/projects';

export const projectService = {
    async listProjects(sectorId?: string): Promise<Project[]> {
        const url = sectorId ? `${API_URL}?sectorId=${sectorId}` : API_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar projetos');
        return response.json();
    },

    async saveProject(project: Project): Promise<void> {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!response.ok) throw new Error('Falha ao salvar projeto');
    },

    async deleteProject(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao remover projeto');
    },
};
