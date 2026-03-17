import React from 'react'
import './form.css'

interface ProgressBarProps {
  /** Progress value 0–100 */
  value: number
  /** Optional label shown above the bar */
  label?: string
}

export const ProgressBar = ({ value, label }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="sb-progress">
      {label && <div className="sb-progress__label">{label}</div>}
      <div className="sb-progress__track">
        <div className="sb-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}
