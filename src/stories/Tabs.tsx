import React, { useState } from 'react'
import './form.css'

interface Tab {
  label: string
  value: string
}

interface TabsProps {
  /** Tab definitions */
  tabs: Tab[]
  /** Currently active tab value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
}

export const Tabs = ({ tabs, value, onChange }: TabsProps) => {
  const [internal, setInternal] = useState(value ?? tabs[0]?.value ?? '')
  const active = value ?? internal

  return (
    <div className="sb-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={['sb-tabs__tab', active === tab.value ? 'sb-tabs__tab--active' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            setInternal(tab.value)
            onChange?.(tab.value)
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
