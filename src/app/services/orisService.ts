export interface OrisEmployee {
    Id: number;
    Nome: string;
    CPF: string;
    Registro: string;
    Cargo: string;
    CentroCusto: string;
    Lotacao: string;
    Empresa: string;
    Email: string;
    TelefoneCelular: string | number | null;
    Situacao: string;
    Admissao?: string;
}

export function cleanOrisId(id: string | number | null | undefined): string {
    if (id === null || id === undefined) return '';
    const idStr = id.toString();
    // Remove anything after a decimal point (like .0) if it's there
    return idStr.split('.')[0];
}

// Proxied via vite.config.ts to bypass CORS
const ORIS_PROXY_BASE = '/oris-api';

export const orisService = {
    /**
     * Fetches an employee directly from the Oris API using the Vite proxy.
     * @param id The employee ID (from Oris)
     */
    async fetchFuncionario(id: string | number): Promise<OrisEmployee | null> {
        try {
            const url = `/api/oris/obterFuncionario?id=${id}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch from Oris:', errorText);
                throw new Error('Funcionário não encontrado ou erro na API Oris');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Oris Service Error:', error);
            throw error;
        }
    },

    /**
     * Helper to parse Oris date format /Date(timestamp)/
     */
    parseOrisDate(orisDate: string | undefined): string {
        if (!orisDate) return '';
        // Handles formats like /Date(1747623600000)/ and /Date(1747623600000-0300)/
        const match = orisDate.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
        if (match) {
            const date = new Date(parseInt(match[1]));
            return date.toLocaleDateString('pt-BR');
        }
        return orisDate;
    },

    /**
     * Maps an Oris employee to a Kanban user format if needed.
     */
    mapToRegistrationData(employee: OrisEmployee) {
        return {
            nome_completo: employee.Nome,
            email: employee.Email || '',
            cargo: employee.Cargo,
            id_oris: employee.Id,
            cpf: employee.CPF,
            matricula_esocial: employee.Registro,
            dt_admissao: this.parseOrisDate(employee.Admissao),
            lotacao: employee.Lotacao,
            situacao: employee.Situacao
        };
    }
};
