import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Handle,
  Position,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MiniMap,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { userService } from '../services/userService';
import { UserAvatar } from '../components/UserAvatar';
import { Badge } from '../components/ui/badge';
import { X, Mail, Briefcase, Building2, Calendar, Activity } from 'lucide-react';

// ── Custom Node ──────────────────────────────────────────────────────────────
function PersonNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div
      className="relative transition-transform"
      style={{ transform: selected ? 'scale(1.05)' : 'scale(1)' }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary/60 !border-0" />

      <div
        className="w-56 rounded-2xl border overflow-hidden shadow-xl transition-all cursor-pointer"
        style={{
          background: 'rgba(15,15,20,0.92)',
          borderColor: selected ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.08)',
          boxShadow: selected
            ? '0 0 0 2px rgba(99,102,241,0.4), 0 20px 40px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {/* Color bar */}
        <div className="h-1 w-full" style={{ background: data.color || '#6366f1' }} />

        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="rounded-full p-0.5 shrink-0"
              style={{ background: data.color || '#6366f1' }}
            >
              <div className="rounded-full bg-background p-0.5">
                <UserAvatar name={data.name} avatar={data.avatar} size="md" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate text-white">{data.name}</p>
              <p className="text-xs text-gray-400 truncate">{data.cargo || '—'}</p>
            </div>
          </div>

          {data.lotacao && (
            <p className="text-[10px] text-gray-500 truncate mt-1">{data.lotacao}</p>
          )}

          <div className="mt-2 pt-2 border-t border-white/5">
            <Badge
              className="text-[10px] h-4 border-none font-semibold px-1.5"
              style={{
                background: `${data.color}22` || 'rgba(99,102,241,0.1)',
                color: data.color || '#6366f1',
              }}
            >
              {data.roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary/60 !border-0" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

// ── Color por role ───────────────────────────────────────────────────────────
function getRoleColor(role: string) {
  if (role === 'chefe') return '#f59e0b';
  if (role === 'gerente') return '#06b6d4';
  if (role === 'admin') return '#a855f7';
  if (role.startsWith('admin-')) return '#f97316';
  return '#6366f1';
}

function getRoleLabel(role: string) {
  if (role === 'chefe') return 'Superintendente';
  if (role === 'gerente') return 'Receptor';
  if (role === 'admin') return 'Administrador';
  if (role.startsWith('admin-')) return 'Gestor de Setor';
  return 'Colaborador';
}

// ── Layout helpers ───────────────────────────────────────────────────────────
const NODE_W = 240;
const NODE_H = 130;
const H_GAP = 40;
const V_GAP = 80;

function buildLayout(users: any[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const byRole = (r: string) => users.filter(u => u.role === r);

  // Layer 0: chefe
  const chefeList = byRole('chefe');
  // Layer 1: gerentes
  const gerenteList = byRole('gerente');
  // Layer 2: admins global
  const adminList = byRole('admin');
  // Layer 3: admins setoriais
  const sectorAdmins = users.filter(u => u.role.startsWith('admin-') && u.role !== 'admin');
  // Layer 4: users
  const regularUsers = users.filter(u => u.role.startsWith('user-'));

  const layers = [chefeList, gerenteList, adminList, sectorAdmins, regularUsers];

  layers.forEach((layer, layerIdx) => {
    const totalW = layer.length * NODE_W + (layer.length - 1) * H_GAP;
    const startX = -totalW / 2 + NODE_W / 2;
    const y = layerIdx * (NODE_H + V_GAP);

    layer.forEach((user, i) => {
      const x = startX + i * (NODE_W + H_GAP);
      nodes.push({
        id: user.id,
        type: 'person',
        position: { x, y },
        data: {
          ...user,
          color: getRoleColor(user.role),
          roleLabel: getRoleLabel(user.role),
        },
      });
    });
  });

  // Edges: chefe → gerentes
  chefeList.forEach(chefe => {
    gerenteList.forEach(g => {
      edges.push({
        id: `${chefe.id}-${g.id}`,
        source: chefe.id,
        target: g.id,
        animated: true,
        style: { stroke: '#6366f180', strokeWidth: 1.5 },
      });
    });
  });

  // Edges: gerentes → admins (global)
  gerenteList.forEach(g => {
    adminList.forEach(a => {
      edges.push({
        id: `${g.id}-${a.id}`,
        source: g.id,
        target: a.id,
        style: { stroke: '#a855f780', strokeWidth: 1.5 },
      });
    });
  });

  // Edges: admins → sector admins
  adminList.forEach(a => {
    sectorAdmins.forEach(sa => {
      edges.push({
        id: `${a.id}-${sa.id}`,
        source: a.id,
        target: sa.id,
        style: { stroke: '#f9731680', strokeWidth: 1.5 },
      });
    });
  });

  // Edges: sector admins → their users
  sectorAdmins.forEach(sa => {
    const sectorId = sa.role.replace('admin-', '');
    const managed = regularUsers.filter(u => u.role === `user-${sectorId}`);
    managed.forEach(u => {
      edges.push({
        id: `${sa.id}-${u.id}`,
        source: sa.id,
        target: u.id,
        style: { stroke: '#6366f140', strokeWidth: 1 },
      });
    });
  });

  return { nodes, edges };
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function OrgChart() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.listUsers().then(users => {
      const filtered = users.filter((u: any) => u.id !== 'ad9j227or');
      const { nodes: n, edges: e } = buildLayout(filtered);
      setNodes(n);
      setEdges(e);
      setLoading(false);
    });
  }, []);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges(eds =>
        addEdge(
          { ...connection, animated: true, style: { stroke: '#6366f180', strokeWidth: 1.5 } },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelected(node.data);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-lg font-bold tracking-tight">Árvore de Distribuição de Tarefas</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Hierarquia Interativa — clique em um card para detalhes
          </p>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Flow */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando organograma...
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.2}
              maxZoom={2}
              colorMode="dark"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="rgba(255,255,255,0.04)"
              />
              <Controls className="!bg-background/80 !border-white/10 !rounded-xl" />
              <MiniMap
                className="!bg-background/80 !border-white/10 !rounded-xl"
                nodeColor={n => (n.data as any).color || '#6366f1'}
                maskColor="rgba(0,0,0,0.5)"
              />
            </ReactFlow>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="absolute right-0 top-0 h-full w-72 border-l border-white/10 bg-background/95 backdrop-blur-xl flex flex-col shadow-2xl z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-sm font-bold">Detalhes</p>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar + nome */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="rounded-full p-1"
                  style={{ background: selected.color }}
                >
                  <div className="rounded-full bg-background p-0.5">
                    <UserAvatar name={selected.name} avatar={selected.avatar} size="lg" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{selected.name}</p>
                  <Badge
                    className="mt-1 text-xs border-none"
                    style={{ background: `${selected.color}22`, color: selected.color }}
                  >
                    {selected.roleLabel}
                  </Badge>
                </div>
              </div>

              {/* Infos */}
              <div className="space-y-3">
                {[
                  { icon: Briefcase, label: 'Cargo', value: selected.cargo },
                  { icon: Mail, label: 'E-mail', value: selected.email },
                  { icon: Building2, label: 'Lotação', value: selected.lotacao },
                  { icon: Calendar, label: 'Admissão', value: selected.dt_admissao },
                  { icon: Activity, label: 'Situação', value: selected.situacao },
                ].map(({ icon: Icon, label, value }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                        <p className="text-sm font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
