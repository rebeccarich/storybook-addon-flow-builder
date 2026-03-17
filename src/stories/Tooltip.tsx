import React, { useState } from 'react'
import './form.css'

interface TooltipProps {
  /** Tooltip text */
  text: string
  /** Element the tooltip wraps */
  children: React.ReactNode
}

export const Tooltip = ({ text, children }: TooltipProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="sb-tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <span className="sb-tooltip">{text}</span>}
    </span>
  )
}
