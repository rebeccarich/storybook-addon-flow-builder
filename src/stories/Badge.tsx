import React from 'react'
import './form.css'

interface BadgeProps {
  /** Badge text */
  children: React.ReactNode
  /** Visual variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export const Badge = ({ variant = 'default', children }: BadgeProps) => (
  <span className={`sb-badge sb-badge--${variant}`}>{children}</span>
)
