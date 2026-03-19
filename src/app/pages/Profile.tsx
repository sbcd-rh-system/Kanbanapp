import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getCurrentUser, setCurrentUser, sectors } from '../data/mockData';
import { userService } from '../services/userService';
import { orisService } from '../services/orisService';
import { SectorBadge } from '../components/SectorBadge';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Save, Mail, Briefcase, Building2, Calendar, Activity } from 'lucide-react';

function formatPhone(raw: string | number | null | undefined): string {
  if (!raw) return '';
  const digits = raw.toString().replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [orisFields, setOrisFields] = useState({
    name: '',
    email: '',
    cargo: '',
    dt_admissao: '',
    lotacao: '',
    situacao: '',
  });

  const [form, setForm] = useState({
    phone: '',
    linkedinUrl: '',
    linkedinPhoto: '',
  });

  const [avatarSeed, setAvatarSeed] = useState('default');
  const [freshSectors, setFreshSectors] = useState<string[]>([]);
  const [freshRole, setFreshRole] = useState<string>('');

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }

    // Busca dados frescos do banco para garantir setores e dados atualizados
    userService.listUsers().then(users => {
      const fresh = users.find((u: any) => u.id === currentUser.id) || currentUser;
      setCurrentUser(fresh as any);
      const s = Array.isArray((fresh as any).sectors)
        ? (fresh as any).sectors
        : JSON.parse((fresh as any).sectors || '[]');
      setFreshSectors(s);
      setFreshRole((fresh as any).role || currentUser.role);
      populateForm(fresh as any);
    }).catch(() => {
      const s = Array.isArray(currentUser.sectors)
        ? currentUser.sectors
        : JSON.parse((currentUser as any).sectors || '[]');
      setFreshSectors(s as string[]);
      setFreshRole(currentUser.role);
      populateForm(currentUser);
    });
  }, []);

  function populateForm(user: any) {
    const url = user.avatar || '';
    const seedMatch = url.match(/seed=(.+)/);

    setOrisFields({
      name: user.name || '',
      email: user.email || '',
      cargo: user.cargo || '',
      dt_admissao: user.dt_admissao || '',
      lotacao: user.lotacao || '',
      situacao: user.situacao || '',
    });

    setForm({
      phone: user.phone || '',
      linkedinUrl: user.linkedin_url || '',
      linkedinPhoto: user.linkedin_photo || '',
    });

    setAvatarSeed(seedMatch ? seedMatch[1] : (user.name || 'default'));

    if (user.id_oris) {
      orisService.fetchFuncionario(user.id_oris).then(emp => {
        if (!emp) return;
        setOrisFields(f => ({
          ...f,
          ...(emp.nome ? { name: emp.nome } : {}),
          ...(emp.email ? { email: emp.email } : {}),
          ...(emp.cargo ? { cargo: emp.cargo } : {}),
          ...(emp.dt_admissao ? { dt_admissao: orisService.formatDate(emp.dt_admissao) } : {}),
          ...(emp.centro_custo ? { lotacao: emp.centro_custo } : {}),
          ...(emp.situacao ? { situacao: emp.situacao } : {}),
        }));
        if (emp.telefone_celular && !user.phone) {
          setForm(f => ({ ...f, phone: formatPhone(emp.telefone_celular) }));
        }
      });
    }
  }

  if (!currentUser) return null;

  const getAvatarUrl = () => {
    if (form.linkedinPhoto) {
      const url = form.linkedinPhoto.trim();
      if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('data:')) return url;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, linkedinPhoto: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = {
        ...currentUser,
        phone: form.phone || undefined,
        linkedin_url: form.linkedinUrl,
        linkedin_photo: form.linkedinPhoto,
        avatar: getAvatarUrl(),
      };
      await userService.saveUser(updated);
      setCurrentUser(updated);
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = getAvatarUrl();

  const isGlobalAdmin = freshRole === 'admin';
  const visibleSectors = isGlobalAdmin ? sectors : sectors.filter(s => freshSectors.includes(s.id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full w-9 h-9 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              {orisFields.cargo || 'Visualizar informações'}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Card do topo: foto + nome + dados corporativos ── */}
          <div className="glass-card rounded-2xl p-6 border-none">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="h-24 w-24 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-background ring-2 ring-primary/20">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`; }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <Input
                    placeholder="https://..."
                    value={form.linkedinPhoto.startsWith('data:') ? '(arquivo enviado)' : form.linkedinPhoto}
                    onChange={e => setForm(f => ({ ...f, linkedinPhoto: e.target.value }))}
                    className="text-xs h-7 w-full sm:w-40"
                    readOnly={form.linkedinPhoto.startsWith('data:')}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full sm:w-40"
                  >
                    <Upload className="h-3 w-3" /> Upload de foto
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  {form.linkedinPhoto.startsWith('data:') && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, linkedinPhoto: '' }))} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors">
                      Remover arquivo
                    </button>
                  )}
                </div>
              </div>

              {/* Dados corporativos (somente leitura) */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold tracking-tight mb-1">{orisFields.name || '—'}</h2>
                <p className="text-sm text-primary font-semibold mb-4">{orisFields.cargo || '—'}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{orisFields.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{orisFields.lotacao || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{orisFields.dt_admissao || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className={`font-semibold text-xs ${orisFields.situacao?.includes('ATIVO') ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {orisFields.situacao || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Setores ── */}
          {visibleSectors.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border-none space-y-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" /> Setores com Acesso
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleSectors.map(s => (
                  <SectorBadge key={s.id} sectorId={s.id as any} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* ── Contato editável ── */}
          <div className="glass-card rounded-2xl p-5 border-none space-y-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
              Contato e Redes Sociais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Telefone / WhatsApp</Label>
                <Input placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Link do perfil (LinkedIn, etc.)</Label>
                <Input placeholder="linkedin.com/in/usuario" value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="gradient-blue border-none shadow-lg shadow-blue-500/20 gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
