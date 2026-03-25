'use client';

import React, { useState, useEffect } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  return (
    <div className={`confirm-dialog-overlay ${visible ? 'show' : ''}`}>
      <div className="confirm-dialog-backdrop" onClick={onCancel}></div>
      <div className={`confirm-dialog-box ${visible ? 'show' : ''}`}>
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="confirm-dialog-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`confirm-dialog-btn confirm ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
