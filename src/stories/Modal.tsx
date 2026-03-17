import React from 'react'
import './form.css'

interface ModalProps {
  /** Modal title */
  title: string
  /** Modal content */
  children: React.ReactNode
  /** Footer actions */
  footer?: React.ReactNode
  /** Whether the modal is open */
  open?: boolean
  /** Close handler */
  onClose?: () => void
}

export const Modal = ({ title, children, footer, open = true, onClose }: ModalProps) => {
  if (!open) return null
  return (
    <div className="sb-modal-overlay">
      <div className="sb-modal">
        <div className="sb-modal__header">
          <h2 className="sb-modal__title">{title}</h2>
          {onClose && (
            <button className="sb-modal__close" onClick={onClose} type="button">
              &times;
            </button>
          )}
        </div>
        <div className="sb-modal__body">{children}</div>
        {footer && <div className="sb-modal__footer">{footer}</div>}
      </div>
    </div>
  )
}
