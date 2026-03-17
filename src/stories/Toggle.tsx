import React from 'react'
import './form.css'

interface ToggleProps {
  /** Label text */
  label: string
  /** Whether the toggle is on */
  checked?: boolean
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Change handler */
  onChange?: (checked: boolean) => void
}

export const Toggle = ({ label, checked = false, disabled = false, onChange }: ToggleProps) => (
  <label className={['sb-toggle', disabled ? 'sb-toggle--disabled' : ''].filter(Boolean).join(' ')}>
    <div
      className={['sb-toggle__track', checked ? 'sb-toggle__track--on' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      <div className="sb-toggle__thumb" />
    </div>
    <span className="sb-toggle__label">{label}</span>
  </label>
)
