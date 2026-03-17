import React from 'react'
import './form.css'

interface AvatarProps {
  /** Image URL */
  src?: string
  /** Alt text / initials fallback */
  name: string
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const Avatar = ({ src, name, size = 'medium' }: AvatarProps) => (
  <div className={`sb-avatar sb-avatar--${size}`} title={name}>
    {src ? <img src={src} alt={name} /> : getInitials(name)}
  </div>
)
