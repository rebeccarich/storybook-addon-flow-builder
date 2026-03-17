import React from 'react'
import './form.css'

interface EmptyStateProps {
  /** Heading text */
  title: string
  /** Description text */
  description?: string
  /** Optional icon or emoji */
  icon?: string
  /** Optional action button */
  action?: React.ReactNode
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="sb-empty-state">
    {icon && <div className="sb-empty-state__icon">{icon}</div>}
    <h3 className="sb-empty-state__title">{title}</h3>
    {description && <p className="sb-empty-state__description">{description}</p>}
    {action && <div className="sb-empty-state__action">{action}</div>}
  </div>
)
