import { ChevronDown } from 'lucide-react';
import { type ReactNode, type SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: ReactNode;
  readonly options: readonly string[];
  readonly placeholder?: string;
}

export function Select({ label, options, placeholder, id, className, ...props }: Readonly<SelectProps>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          defaultValue={props.value === undefined ? '' : undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-xl bg-surface-container-lowest border border-card-border/90 px-3.5 pr-10 text-sm font-medium text-on-surface shadow-2xs',
            'transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-outline">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option} value={option} className="bg-surface text-on-surface py-1">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
          size={16}
        />
      </div>
    </div>
  );
}

export default Select;
