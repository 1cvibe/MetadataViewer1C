/**
 * Модальное окно подтверждения действий
 */

import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена'
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const footer = (
    <>
      <button className="btn-secondary" onClick={onCancel}>
        {cancelLabel}
      </button>
      <button
        className="btn-primary"
        style={{ background: 'var(--vscode-errorForeground)' }}
        onClick={handleConfirm}
      >
        {confirmLabel}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      title="Подтверждение"
      onClose={onCancel}
      footer={footer}
    >
      <div className="form-field">
        <div style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
      </div>
    </Modal>
  );
};

