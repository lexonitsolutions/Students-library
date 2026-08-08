import { type InputHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly hint?: string;
  readonly containerClassName?: string;
}

export function Input({ label, hint, id, className, containerClassName, ...props }: Readonly<InputProps>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-12 w-full rounded-lg bg-surface-soft px-4 text-body-md text-on-surface placeholder:text-outline',
          'border border-transparent transition-colors duration-150',
          'focus:bg-white focus:border-primary-container focus:outline-none',
          className,
        )}
        {...props}
      />
      {hint && <span className="text-label-sm text-outline">{hint}</span>}
    </div>
  );
}

export default Input;
