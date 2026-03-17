import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { sectors } from '../data/mockData';
import { orisService, cleanOrisId } from '../services/orisService';
import { toast } from 'sonner';
import { Search, UserPlus, Loader2, Edit, RefreshCw, User, Upload } from 'lucide-react';

const AVATAR_STYLES = [
    { id: 'avataaars', name: 'Original' },
    { id: 'bottts', name: 'Robôs' },
    { id: 'pixel-art', name: 'Pixel' },
    { id: 'lorelei', name: 'Ilustração' },
    { id: 'adventurer', name: 'Aventura' },
];

interface UserRegistrationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUserAdded: (userData: any) => void;
    editingUser?: any;
    /** Quando definido, limita o modal ao escopo do gestor de setor (não-admin) */
    restrictedToSectors?: string[];
}

export function UserRegistrationModal({ isOpen, onOpenChange, onUserAdded, editingUser, restrictedToSectors }: UserRegistrationModalProps) {
    // Setores disponíveis: todos (admin) ou apenas os do gestor (user)
    const availableSectors = restrictedToSectors
        ? sectors.filter(s => restrictedToSectors.includes(s.id))
        : sectors;
    const isRestricted = !!restrictedToSectors;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        selectedSectors: [] as string[],
        cargo: '',
        dt_admissao: '',
        lotacao: '',
        situacao: '',
        linkedinUrl: '',    // Link do perfil → usado no badge
        linkedinPhoto: '',  // URL direta da foto → usado no avatar
        phone: '',
    });

    const [orisData, setOrisData] = useState({
        id: '',
        cpf: '',
        registro: ''
    });

    const [avatarConfig, setAvatarConfig] = useState({
        style: 'avataaars',
        seed: Math.random().toString(36).substring(7)
    });


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(f => ({ ...f, linkedinPhoto: reader.result as string }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const getAvatarUrl = () => {
        // Use the direct photo URL if provided
        if (formData.linkedinPhoto) {
            const url = formData.linkedinPhoto.trim();
            if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('data:')) {
                return url;
            }
        }
        return `https://api.dicebear.com/7.x/${avatarConfig.style}/svg?seed=${avatarConfig.seed}`;
    };



    const currentAvatarUrl = getAvatarUrl();

    const formatPhone = (raw: string | number | null | undefined): string => {
        if (!raw) return '';
        const digits = raw.toString().replace(/\D/g, '');
        if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
        if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
        return digits;
    };

    // Sync form with editingUser when modal opens (useLayoutEffect evita flash de campos vazios)
    useLayoutEffect(() => {
        if (isOpen && editingUser) {
            const initialRole = editingUser.role || 'user';
            const isSectorAdmin = initialRole.startsWith('admin-') && initialRole !== 'admin';

            setFormData({
                name: editingUser.name || '',
                email: editingUser.email || '',
                role: isSectorAdmin ? 'sector-admin' : initialRole,
                selectedSectors: Array.isArray(editingUser.sectors)
                    ? editingUser.sectors
                    : (typeof editingUser.sectors === 'string' ? JSON.parse(editingUser.sectors || '[]') : []),
                cargo: editingUser.cargo || '',
                dt_admissao: editingUser.dt_admissao || '',
                lotacao: editingUser.lotacao || '',
                situacao: editingUser.situacao || '',
                linkedinUrl: editingUser.linkedin_url || '',
                linkedinPhoto: editingUser.linkedin_photo || '',
                phone: editingUser.phone || '',
            });

            // Try to extract style and seed from existing avatar URL
            const url = editingUser.avatar || '';
            const styleMatch = url.match(/7\.x\/(.+?)\/svg/);
            const seedMatch = url.match(/seed=(.+)/);

            setAvatarConfig({
                style: styleMatch ? styleMatch[1] : 'avataaars',
                seed: seedMatch ? seedMatch[1] : (editingUser.name || 'default')
            });
        } else if (isOpen) {
            // Reset for new user — pré-seleciona os setores do gestor automaticamente
            setFormData({
                name: '',
                email: '',
                role: 'user',
                selectedSectors: restrictedToSectors ? [...restrictedToSectors] : [],
                cargo: '',
                dt_admissao: '',
                lotacao: '',
                situacao: '',
                linkedinUrl: '',
                linkedinPhoto: '',
                phone: '',
            });
            setAvatarConfig({
                style: 'avataaars',
                seed: Math.random().toString(36).substring(7)
            });
        }
    }, [isOpen, editingUser]);

    // Busca telefone do Oris se o usuário tem id_oris mas phone está vazio
    useEffect(() => {
        if (!isOpen || !editingUser?.id_oris || editingUser?.phone) return;
        orisService.fetchFuncionario(editingUser.id_oris).then(emp => {
            if (emp?.telefone_celular) {
                setFormData(f => ({ ...f, phone: formatPhone(emp.telefone_celular) }));
            }
        });
    }, [isOpen, editingUser?.id_oris]);

    const randomizeAvatar = () => {
        setAvatarConfig(prev => ({
            ...prev,
            seed: Math.random().toString(36).substring(7)
        }));
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await orisService.searchFuncionarios(val);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEmployee = (emp: any) => {
        setFormData({
            ...formData,
            name: emp.nome || '',
            email: emp.email || '',
            cargo: emp.cargo || '',
            dt_admissao: orisService.formatDate(emp.dt_admissao) || '',
            lotacao: emp.lotacao || '',
            phone: formatPhone(emp.telefone_celular),
            situacao: emp.situacao || '',
        });
        setOrisData({
            id: emp.id,
            cpf: emp.cpf,
            registro: emp.registro
        });
        setSearchResults([]);
        setSearchQuery('');
        toast.success(`Dados de ${emp.nome} carregados!`);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        if (formData.selectedSectors.length === 0) {
            toast.error('Selecione pelo menos um setor');
            return;
        }

        const userToSave = {
            id: editingUser?.id || Math.random().toString(36).substr(2, 9),
            name: formData.name,
            email: formData.email,
            avatar: currentAvatarUrl,
            role: (isRestricted && restrictedToSectors && restrictedToSectors.length > 0)
                ? `user-${restrictedToSectors[0]}` // Sub-usuário (criado por gestor)
                : formData.role === 'sector-admin' && formData.selectedSectors.length > 0
                    ? `admin-${formData.selectedSectors[0]}` // Admin de Setor (criado por admin global)
                    : formData.role as any,
            sectors: formData.selectedSectors as any,
            id_oris: orisData.id || editingUser?.id_oris || null,
            linkedin_url: formData.linkedinUrl,
            linkedin_photo: formData.linkedinPhoto,
            phone: formData.phone || null,
            cpf: orisData.cpf || editingUser?.cpf || null,
            matricula_esocial: orisData.registro || editingUser?.matricula_esocial || null,
            cargo: formData.cargo,
            dt_admissao: formData.dt_admissao || null,
            lotacao: formData.lotacao,
            situacao: formData.situacao
        };

        onUserAdded(userToSave);
        onOpenChange(false);
    };

    const toggleSector = (sectorId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            selectedSectors: prev.selectedSectors.includes(sectorId)
                ? prev.selectedSectors.filter((id: string) => id !== sectorId)
                : [...prev.selectedSectors, sectorId]
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 shrink-0">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        {editingUser ? <Edit className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold leading-tight">
                            {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                        </DialogTitle>
                         <DialogDescription className="text-xs text-muted-foreground">
                            Busque no banco corporativo por nome ou ID para preencher automaticamente.
                        </DialogDescription>
                    </div>
                </div>

                {/* Body — two columns */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left Panel: Avatar ──────────────────── */}
                    <div className="w-64 shrink-0 flex flex-col items-center gap-5 p-6 border-r border-white/10 bg-muted/20 overflow-y-auto">
                        {/* Avatar preview */}
                        <div className="relative group mt-2">
                            <div className="h-28 w-28 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-background ring-2 ring-primary/20">
                                <img
                                    src={currentAvatarUrl}
                                    alt="Avatar Preview"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/${avatarConfig.style}/svg?seed=${avatarConfig.seed}`;
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={randomizeAvatar}
                                className="absolute -bottom-1 -right-1 rounded-full shadow-lg border h-7 w-7"
                                title="Randomizar avatar"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center font-semibold uppercase tracking-widest">Estilo do Avatar</p>

                        {/* Avatar style buttons */}
                        <div className="flex flex-col gap-1.5 w-full">
                            {AVATAR_STYLES.map(s => (
                                <Button
                                    key={s.id}
                                    type="button"
                                    variant={avatarConfig.style === s.id ? 'default' : 'ghost'}
                                    size="sm"
                                    className="text-xs h-8 w-full justify-start px-3"
                                    onClick={() => setAvatarConfig(prev => ({ ...prev, style: s.id }))}
                                >
                                    {s.name}
                                </Button>
                            ))}
                        </div>

                        <div className="w-full border-t border-white/10 pt-4 space-y-3">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                                Contato e Redes Sociais
                            </p>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Telefone / WhatsApp</label>
                                <Input
                                    placeholder="(11) 99999-9999"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="text-xs h-8"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">Link do perfil (LinkedIn, etc.)</label>
                                <Input
                                    placeholder="linkedin.com/in/usuario"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    className="text-xs h-8"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">URL da foto</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://..."
                                        value={formData.linkedinPhoto.startsWith('data:') ? '(arquivo enviado)' : formData.linkedinPhoto}
                                        onChange={(e) => setFormData({ ...formData, linkedinPhoto: e.target.value })}
                                        className="text-xs h-8 flex-1"
                                        readOnly={formData.linkedinPhoto.startsWith('data:')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-8 px-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                                        title="Enviar arquivo"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                                {formData.linkedinPhoto.startsWith('data:') && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, linkedinPhoto: '' }))}
                                        className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                    >
                                        Remover arquivo
                                    </button>
                                )}
                                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                                    Cole uma URL ou faça upload de um arquivo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel: Form ───────────────────── */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* Employee Search */}
                            <div className="relative bg-muted/40 p-3 rounded-xl border border-dashed border-white/10 z-20">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Buscar Colaborador (Banco Corp.)</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Digite nome ou ID..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10 h-10 bg-background"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>

                                {/* Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-background border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                        {searchResults.map((emp) => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => handleSelectEmployee(emp)}
                                                className="w-full flex flex-col items-start px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                                            >
                                                <span className="text-sm font-bold text-white">{emp.nome}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">ID: {emp.id}</span>
                                                    <span className="text-xs text-muted-foreground truncate">{emp.cargo} • {emp.lotacao}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* Nome + Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-sm">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Cargo + Data Admissão */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cargo" className="text-sm">Cargo</Label>
                                    <Input
                                        id="cargo"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="dt_admissao" className="text-sm">Data Admissão</Label>
                                    <Input
                                        id="dt_admissao"
                                        value={formData.dt_admissao}
                                        onChange={(e) => setFormData({ ...formData, dt_admissao: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Lotação + Situação */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="lotacao" className="text-sm">Lotação</Label>
                                    <Input
                                        id="lotacao"
                                        value={formData.lotacao}
                                        onChange={(e) => setFormData({ ...formData, lotacao: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="situacao" className="text-sm">Situação</Label>
                                    <Input
                                        id="situacao"
                                        value={formData.situacao}
                                        onChange={(e) => setFormData({ ...formData, situacao: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Função */}
                            {isRestricted ? (
                                // Gestores só podem criar usuários comuns
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-white/10">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-medium">Colaborador (Usuário Comum)</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Função fixa</span>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label htmlFor="role" className="text-sm">Função no Sistema</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                                    >
                                        <SelectTrigger className="rounded-xl border-white/10 bg-muted/20">
                                            <SelectValue placeholder="Selecione a função" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-white/10">
                                            <SelectItem value="user">Colaborador (Usuário)</SelectItem>
                                            <SelectItem value="sector-admin">Administrador de Setor</SelectItem>
                                            <SelectItem value="admin">Administrador Global</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Setores */}
                            <div className="space-y-2">
                                <Label className="text-sm">Setores com Acesso</Label>
                                {isRestricted && (
                                    <p className="text-xs text-muted-foreground">Você pode vincular apenas setores que você gerencia.</p>
                                )}
                                <div className="grid grid-cols-3 gap-2 border border-white/10 rounded-xl p-3 bg-muted/20">
                                    {availableSectors.map((sector) => (
                                        <div key={sector.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`sector-${sector.id}`}
                                                checked={formData.selectedSectors.includes(sector.id)}
                                                onCheckedChange={() => toggleSector(sector.id)}
                                            />
                                            <label
                                                htmlFor={`sector-${sector.id}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {sector.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="gap-2">
                                    {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
