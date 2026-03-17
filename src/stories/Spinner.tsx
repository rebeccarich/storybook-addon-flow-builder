import React from 'react'
import './form.css'

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large'
  /** Optional label below the spinner */
  label?: string
}

export const Spinner = ({ size = 'medium', label }: SpinnerProps) => (
  <div className="sb-spinner-container">
    <div className={`sb-spinner sb-spinner--${size}`} />
    {label && <div className="sb-spinner__label">{label}</div>}
  </div>
)
