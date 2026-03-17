import React from 'react'
import './form.css'

interface TextInputProps {
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value?: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  /** Disabled state */
  disabled?: boolean
  /** Error state */
  error?: boolean
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const TextInput = ({
  placeholder,
  value,
  type = 'text',
  disabled = false,
  error = false,
  ...props
}: TextInputProps) => (
  <input
    type={type}
    className={['sb-input', error && 'sb-input--error', disabled && 'sb-input--disabled']
      .filter(Boolean)
      .join(' ')}
    placeholder={placeholder}
    value={value}
    disabled={disabled}
    {...props}
  />
)
