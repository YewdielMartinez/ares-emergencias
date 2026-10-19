import { useEffect, useRef } from 'react';
import { Menu, useLatest, useTabs } from '@yewdiel21/motion-kit/react';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface Choice<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

/** Composición de Menu del kit: conserva roles, teclado, foco y animación. */
export function SelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  icon,
  triggerLabel,
}: {
  label: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  icon?: ReactNode;
  triggerLabel?: ReactNode;
}) {
  return (
    <Menu.Root onSelect={(next) => onChange(next as T)}>
      <Menu.Trigger
        className="mk-button mk-button--outlined mk-button--sm"
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
      >
        {icon}
        <span className="menu-value">
          {triggerLabel ?? options.find((option) => option.value === value)?.label}
        </span>
        <ChevronDown size={16} />
      </Menu.Trigger>
      <Menu.Content aria-label={label}>
        {options.map((option) => (
          <Menu.Item key={option.value} value={option.value} aria-checked={option.value === value}>
            {option.icon}
            <span>{option.label}</span>
            {option.value === value && <Check size={16} />}
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu.Root>
  );
}

/** Adaptador controlado de la receta tabs, con indicador y teclado del kit. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const change = useLatest(onChange);
  const choices = useLatest(options);
  const signature = options.map((option) => option.value).join('|');
  const tabs = useTabs(
    root,
    { onSelect: (index) => change.current(choices.current[index].value) },
    [signature],
  );
  useEffect(() => {
    tabs.current?.select(options.findIndex((option) => option.value === value));
  }, [value, signature]);
  return (
    <div ref={root} className="mk-segmented" data-mk="tabs" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-mk-tab=""
          aria-selected={option.value === value}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
      <span data-mk-indicator="" />
    </div>
  );
}

export function ControlSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="control-switch">
      <input
        className="mk-switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
