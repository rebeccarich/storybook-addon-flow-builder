import React from 'react'
import './form.css'

interface FormFieldProps {
  /** Field label */
  label: string
  /** Help text below the input */
  hint?: string
  /** Error message (replaces hint when present) */
  error?: string
  /** The input element */
  children: React.ReactNode
}

export const FormField = ({ label, hint, error, children }: FormFieldProps) => (
  <div className="sb-field">
    <label className="sb-field__label">{label}</label>
    {children}
    {error ? (
      <span className="sb-field__error">{error}</span>
    ) : hint ? (
      <span className="sb-field__hint">{hint}</span>
    ) : null}
  </div>
)
