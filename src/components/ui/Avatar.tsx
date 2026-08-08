import { cn } from '../../lib/cn';

export interface AvatarProps {
  readonly src?: string;
  readonly name: string;
  readonly size?: number;
  readonly className?: string;
}

export function Avatar({ src, name, size = 40, className }: Readonly<AvatarProps>) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn('rounded-full object-cover bg-surface-container', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-container text-on-primary-container font-semibold',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
