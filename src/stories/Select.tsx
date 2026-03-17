import React from 'react'
import './form.css'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  /** Available options */
  options: SelectOption[]
  /** Currently selected value */
  value?: string
  /** Placeholder when nothing is selected */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export const Select = ({
  options,
  value,
  placeholder = 'Select...',
  disabled = false,
  ...props
}: SelectProps) => (
  <select className="sb-select" value={value} disabled={disabled} {...props}>
    <option value="" disabled>
      {placeholder}
    </option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
)
