export interface OrisEmployee {
    id: number | string;
    nome: string;
    cpf: string;
    registro: string;
    cargo: string;
    centro_custo: string;
    lotacao: string;
    empresa: string;
    email: string;
    telefone_celular: string | number | null;
    situacao: string;
    dt_admissao?: string;
}

export function cleanOrisId(id: string | number | null | undefined): string {
    if (id === null || id === undefined) return '';
    const idStr = id.toString();
    // Remove anything after a decimal point (like .0) if it's there
    return idStr.split('.')[0];
}

export const orisService = {
    /**
     * Busca funcionários por nome ou ID no Supabase através do backend.
     */
    async searchFuncionarios(query: string): Promise<OrisEmployee[]> {
        try {
            const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Erro ao buscar funcionários');
            return response.json();
        } catch (error) {
            console.error('Search Funcionarios Error:', error);
            return [];
        }
    },

    /**
     * Busca um funcionário específico pelo ID.
     */
    async fetchFuncionario(id: string | number): Promise<OrisEmployee | null> {
        try {
            const response = await fetch(`/api/employees/${id}`);
            if (!response.ok) throw new Error('Funcionário não encontrado');
            return response.json();
        } catch (error) {
            console.error('Fetch Funcionario Error:', error);
            return null;
        }
    },

    /**
     * Helper para formatar datas (se necessário)
     */
    formatDate(dateStr: string | undefined): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
        } catch {
            return dateStr;
        }
    },

    /**
     * Mapeia os dados do banco Oris Sync para o formato do Kanban se necessário.
     */
    mapToRegistrationData(employee: OrisEmployee) {
        return {
            nome_completo: employee.nome,
            email: employee.email || '',
            cargo: employee.cargo,
            id_oris: employee.id,
            cpf: employee.cpf,
            matricula_esocial: employee.registro,
            dt_admissao: this.formatDate(employee.dt_admissao),
            lotacao: employee.lotacao,
            situacao: employee.situacao
        };
    }
};
