/**
 * Модальное окно редактирования типа реквизита
 * Используется для редактирования типа реквизита объекта (не табличной части)
 */

import React from 'react';
import { Modal } from './Modal';
import { TypeWidget } from '../../widgets/TypeWidget';

interface AttributeTypeEditorModalProps {
  isOpen: boolean;
  attributeIndex: number | null;
  attributeType: any;
  metadata: {
    registers: string[];
    referenceTypes: string[];
  };
  onClose: () => void;
  onSave: (type: any) => void;
}

export const AttributeTypeEditorModal: React.FC<AttributeTypeEditorModalProps> = ({
  isOpen,
  attributeIndex,
  attributeType,
  metadata,
  onClose,
  onSave
}) => {
  const footer = (
    <button className="btn-secondary" onClick={onClose}>Закрыть</button>
  );

  return (
    <Modal
      isOpen={isOpen}
      title="Редактировать тип реквизита"
      onClose={onClose}
      footer={footer}
    >
      <div className="form-field">
        <label>Тип</label>
        <TypeWidget
          {...({
            id: `edit-attr-type-${attributeIndex}`,
            value: attributeType,
            onChange: onSave,
            schema: {},
            label: 'Type',
            required: false,
            readonly: false,
            rawErrors: [],
            errorSchema: {},
            registry: {},
            formContext: {},
            options: {
              registers: metadata.registers,
              referenceTypes: metadata.referenceTypes
            }
          } as any)}
        />
      </div>
    </Modal>
  );
};

