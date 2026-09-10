import { cn } from '../../lib/cn';

export interface AvatarProps {
  readonly src?: string | null;
  readonly name?: string | null;
  readonly size?: number;
  readonly className?: string;
}

export function Avatar({ src, name, size = 40, className }: Readonly<AvatarProps>) {
  const safeName = (name && typeof name === 'string' ? name.trim() : '') || 'User';

  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  if (src && typeof src === 'string' && src.trim()) {
    return (
      <img
        src={src}
        alt={safeName}
        width={size}
        height={size}
        className={cn('rounded-full object-cover bg-surface-container shrink-0', className)}
        style={{ width: size, height: size }}
        onError={(e) => {
          // If image fails to load, gracefully fall back to initials
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold select-none shrink-0',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
