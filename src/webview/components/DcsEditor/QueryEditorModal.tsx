import React, { useState, useEffect } from 'react';
import './QueryEditorModal.css';

export interface QueryEditorModalProps {
  isOpen: boolean;
  queryText: string;
  onSave: (newQuery: string) => void;
  onCancel: () => void;
}

export const QueryEditorModal: React.FC<QueryEditorModalProps> = ({
  isOpen,
  queryText,
  onSave,
  onCancel,
}) => {
  const [editedQuery, setEditedQuery] = useState(queryText);

  // Синхронизировать состояние при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setEditedQuery(queryText);
    }
  }, [isOpen, queryText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter / Cmd+Enter = Сохранить
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Убрана обработка Escape - закрытие только по кнопке "Закрыть"
  };

  return (
    <div className="query-editor-modal-overlay" onClick={onCancel}>
      <div className="query-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="query-editor-modal__header">
          <h3>Редактор запроса</h3>
          <button
            type="button"
            className="query-editor-modal__close"
            onClick={onCancel}
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="query-editor-modal__body">
          <textarea
            className="query-editor-modal__textarea"
            value={editedQuery}
            onChange={(e) => setEditedQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Текст запроса..."
            autoFocus
          />
        </div>

        <div className="query-editor-modal__footer">
          <div className="query-editor-modal__hint">
            Ctrl+Enter - Сохранить и автообновить поля
          </div>
          <div className="query-editor-modal__actions">
            <button
              type="button"
              className="query-editor-modal__btn query-editor-modal__btn--secondary"
              onClick={onCancel}
            >
              Закрыть
            </button>
            <button
              type="button"
              className="query-editor-modal__btn query-editor-modal__btn--primary"
              onClick={handleSave}
            >
              Сохранить и автообновить поля
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

