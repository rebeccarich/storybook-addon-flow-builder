import React from 'react'
import './form.css'

interface AlertProps {
  /** Alert variant */
  variant?: 'info' | 'success' | 'warning' | 'error'
  /** Alert message */
  children: React.ReactNode
}

export const Alert = ({ variant = 'info', children }: AlertProps) => (
  <div className={`sb-alert sb-alert--${variant}`}>{children}</div>
)
