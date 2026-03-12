import { Badge } from './ui/badge';
import { getSectorById } from '../data/mockData';
import { SectorId } from '../types';

interface SectorBadgeProps {
  sectorId: SectorId;
  size?: 'sm' | 'md';
}

export function SectorBadge({ sectorId, size = 'md' }: SectorBadgeProps) {
  const sector = getSectorById(sectorId);

  if (!sector) return null;

  return (
    <Badge
      style={{
        backgroundColor: `${sector.color}20`,
        color: sector.color,
        borderColor: sector.color,
      }}
      className={`border ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm'}`}
    >
      {sector.name}
    </Badge>
  );
}
