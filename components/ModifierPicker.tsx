'use client'
import clsx from 'clsx'

import { MODIFIERS, type ModifierId } from '@/lib/modifiers'

type ModifierPickerProps = {
  modifiers: readonly ModifierId[]
  onToggle: (id: ModifierId) => void
  disabled?: boolean
}

const ModifierPicker = ({ modifiers, onToggle, disabled = false }: ModifierPickerProps) => (
  <div className="grid gap-2">
    {MODIFIERS.map(modifier => {
      const active = modifiers.includes(modifier.id)

      return (
        <button
          key={modifier.id}
          type="button"
          onClick={() => onToggle(modifier.id)}
          disabled={disabled}
          className={clsx(
            'border-[3px] border-ink px-4 py-3 text-left transition-transform',
            active ? 'bg-ink text-panel' : 'bg-panel',
            disabled
              ? 'cursor-default opacity-80'
              : 'active:translate-x-[2px] active:translate-y-[2px]',
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-bold tracking-widest uppercase">
              {modifier.label}
            </span>
            <span className="font-mono text-[11px] font-bold tracking-widest uppercase">
              {active ? 'On' : 'Off'}
            </span>
          </span>
          <span
            className={clsx(
              'mt-1 block font-mono text-[11px]',
              active ? 'text-panel' : 'text-dim',
            )}
          >
            {modifier.description}
          </span>
        </button>
      )
    })}
  </div>
)

export default ModifierPicker
