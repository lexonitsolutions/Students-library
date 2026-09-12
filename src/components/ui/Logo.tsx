import { cn } from '../../lib/cn';

export interface LogoProps {
  /**
   * 'horizontal' (default): icon + wordmark side by side
   * 'stacked': icon on top, wordmark below
   * 'icon': just the icon mark
   */
  readonly variant?: 'horizontal' | 'stacked' | 'icon';
  readonly height?: number;
  readonly className?: string;
  readonly imgClassName?: string;
  readonly alt?: string;
}

export function Logo({
  variant = 'horizontal',
  height,
  className,
  imgClassName,
  alt = 'Studexa',
}: Readonly<LogoProps>) {
  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center shrink-0', className)}>
        <img
          src="/images/studexa-icon.png"
          alt={alt}
          style={height ? { height, width: height } : undefined}
          className={cn('object-contain shrink-0', imgClassName || 'h-8 w-8')}
        />
      </div>
    );
  }

  const isStacked = variant === 'stacked';
  const lightSrc = isStacked ? '/images/studexa-stacked-light.png' : '/images/studexa-logo-light.png';
  const darkSrc = isStacked ? '/images/studexa-stacked-dark.png' : '/images/studexa-logo-dark.png';

  const defaultHeightClass = isStacked ? 'h-16 w-auto' : 'h-8 w-auto';

  return (
    <div className={cn('relative inline-flex items-center shrink-0 select-none', className)}>
      {/* Light Mode Logo */}
      <img
        src={lightSrc}
        alt={alt}
        style={height ? { height } : undefined}
        className={cn('block dark:hidden object-contain shrink-0', imgClassName || defaultHeightClass)}
      />
      {/* Dark Mode Logo */}
      <img
        src={darkSrc}
        alt={alt}
        style={height ? { height } : undefined}
        className={cn('hidden dark:block object-contain shrink-0', imgClassName || defaultHeightClass)}
      />
    </div>
  );
}

export default Logo;
