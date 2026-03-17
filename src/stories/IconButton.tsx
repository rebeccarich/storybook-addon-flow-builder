import React from 'react'
import './form.css'

interface IconButtonProps {
  /** Accessible label */
  label: string
  /** Icon character or emoji */
  icon: string
  /** Visual variant */
  variant?: 'default' | 'danger'
  /** Size */
  size?: 'small' | 'medium'
  /** Click handler */
  onClick?: () => void
}

export const IconButton = ({
  label,
  icon,
  variant = 'default',
  size = 'medium',
  onClick
}: IconButtonProps) => (
  <button
    type="button"
    className={`sb-icon-button sb-icon-button--${variant} sb-icon-button--${size}`}
    aria-label={label}
    title={label}
    onClick={onClick}
  >
    {icon}
  </button>
)
