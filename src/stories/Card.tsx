import React from 'react'
import './form.css'

interface CardProps {
  /** Optional card title */
  title?: string
  /** Card content */
  children: React.ReactNode
  /** Optional footer content */
  footer?: React.ReactNode
}

export const Card = ({ title, children, footer }: CardProps) => (
  <div className="sb-card">
    {title && <div className="sb-card__header">{title}</div>}
    <div className="sb-card__body">{children}</div>
    {footer && <div className="sb-card__footer">{footer}</div>}
  </div>
)
