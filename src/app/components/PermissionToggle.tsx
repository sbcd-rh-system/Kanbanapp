import { Lock, Globe } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface PermissionToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
  disabled?: boolean;
}

export function PermissionToggle({ isPrivate, onChange, disabled = false }: PermissionToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Globe className={`h-4 w-4 ${!isPrivate ? 'text-green-500' : 'text-muted-foreground'}`} />
      <Switch
        checked={isPrivate}
        onCheckedChange={onChange}
        disabled={disabled}
        id="privacy-toggle"
      />
      <Lock className={`h-4 w-4 ${isPrivate ? 'text-amber-500' : 'text-muted-foreground'}`} />
      <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
        {isPrivate ? 'Privado' : 'Público'}
      </Label>
    </div>
  );
}
