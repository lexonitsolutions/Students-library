import { ChevronDown } from 'lucide-react';
import { type SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly options: readonly string[];
  readonly placeholder?: string;
}

export function Select({ label, options, placeholder, id, className, ...props }: Readonly<SelectProps>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-label-md text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          defaultValue={props.value === undefined ? '' : undefined}
          className={cn(
            'h-12 w-full appearance-none rounded-lg bg-surface-soft px-4 pr-10 text-body-md text-on-surface',
            'border border-transparent transition-colors duration-150',
            'focus:bg-white focus:border-primary-container focus:outline-none',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-outline"
          size={18}
        />
      </div>
    </div>
  );
}

export default Select;
