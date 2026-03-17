import React from 'react'
import './form.css'

interface CheckboxProps {
  /** Label text */
  label: string
  /** Checked state */
  checked?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const Checkbox = ({ label, checked = false, disabled = false, ...props }: CheckboxProps) => (
  <label className="sb-checkbox">
    <input
      type="checkbox"
      className="sb-checkbox__input"
      checked={checked}
      disabled={disabled}
      {...props}
    />
    {label}
  </label>
)
