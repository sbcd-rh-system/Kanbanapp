import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface UserAvatarProps {
  name: string;
  avatar: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function UserAvatar({ name, avatar, size = 'md', showTooltip = true }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarComponent = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={avatar} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );

  if (!showTooltip) return avatarComponent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{avatarComponent}</TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
