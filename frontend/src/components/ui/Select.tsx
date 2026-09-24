import { ChevronDown } from 'lucide-react';
import { type ReactNode, type SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/cn';

export type SelectOption = string | { readonly value: string; readonly label: string };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: ReactNode;
  readonly options: readonly SelectOption[];
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
            'h-10 w-full appearance-none rounded-lg bg-surface-container-lowest border border-card-border px-3 pr-9 text-sm text-on-surface shadow-2xs',
            'transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none cursor-pointer',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-outline">
              {placeholder}
            </option>
          )}
          {(options || []).filter(Boolean).map((option) => {
            const val = typeof option === 'string' ? option : option?.value ?? '';
            const lbl = typeof option === 'string' ? option : option?.label ?? val;
            return (
              <option key={val} value={val} className="bg-surface text-on-surface py-1">
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
          size={15}
        />
      </div>
    </div>
  );
}

export default Select;
