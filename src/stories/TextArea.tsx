import React from 'react'
import './form.css'

interface TextAreaProps {
  /** Placeholder text */
  placeholder?: string
  /** Current value */
  value?: string
  /** Number of visible rows */
  rows?: number
  /** Disabled state */
  disabled?: boolean
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export const TextArea = ({
  placeholder,
  value,
  rows = 4,
  disabled = false,
  ...props
}: TextAreaProps) => (
  <textarea
    className="sb-textarea"
    placeholder={placeholder}
    value={value}
    rows={rows}
    disabled={disabled}
    {...props}
  />
)
