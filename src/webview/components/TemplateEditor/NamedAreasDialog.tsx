/**
 * Диалог управления именованными областями
 * Отображает список всех именованных областей и позволяет создавать, редактировать и удалять их
 */

import React, { useState, useEffect } from 'react';
import { NamedArea } from '../../../templatInterfaces';
import { NamedAreaDialog } from './NamedAreaDialog';
import './template-editor.css';

interface NamedAreasDialogProps {
    isOpen: boolean;
    namedAreas: NamedArea[];
    onCreate: (area: NamedArea) => void;
    onUpdate: (oldName: string, area: NamedArea) => void;
    onDelete: (name: string) => void;
    onCancel: () => void;
}

export const NamedAreasDialog: React.FC<NamedAreasDialogProps> = ({
    isOpen,
    namedAreas,
    onCreate,
    onUpdate,
    onDelete,
    onCancel
}) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<NamedArea | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsEditDialogOpen(false);
            setEditingArea(null);
        }
    }, [isOpen, namedAreas]);

    const handleCreateNew = () => {
        setEditingArea(null);
        setIsEditDialogOpen(true);
        setError(null);
    };

    const handleEdit = (area: NamedArea) => {
        setEditingArea(area);
        setIsEditDialogOpen(true);
        setError(null);
    };

    const handleDelete = (name: string) => {
        if (confirm(`Удалить именованную область "${name}"?`)) {
            try {
                onDelete(name);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка при удалении области');
            }
        }
    };

    const handleSaveArea = (area: NamedArea) => {
        try {
            if (editingArea) {
                // Редактирование существующей области
                onUpdate(editingArea.name, area);
            } else {
                // Создание новой области
                onCreate(area);
            }
            setIsEditDialogOpen(false);
            setEditingArea(null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при сохранении области');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && !isEditDialogOpen) {
            onCancel();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div 
                className="named-areas-dialog-overlay"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isEditDialogOpen) {
                        onCancel();
                    }
                }}
            >
                <div 
                    className="named-areas-dialog"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                >
                    <div className="named-areas-dialog-header">
                        <h3>Именованные области</h3>
                        <button
                            className="named-areas-dialog-close"
                            onClick={onCancel}
                            title="Закрыть (Esc)"
                            disabled={isEditDialogOpen}
                        >
                            ×
                        </button>
                    </div>

                    <div className="named-areas-dialog-content">
                        {error && (
                            <div className="named-areas-dialog-error">
                                {error}
                            </div>
                        )}

                        <div className="named-areas-list-header">
                            <button
                                className="named-areas-button-primary"
                                onClick={handleCreateNew}
                                disabled={isEditDialogOpen}
                            >
                                ➕ Создать новую область
                            </button>
                        </div>

                        {namedAreas.length === 0 ? (
                            <div className="named-areas-empty">
                                Именованные области отсутствуют
                            </div>
                        ) : (
                            <div className="named-areas-list">
                                {namedAreas.map((area) => (
                                    <div key={area.name} className="named-areas-list-item">
                                        <div className="named-areas-list-item-info">
                                            <div className="named-areas-list-item-name">
                                                <strong>{area.name}</strong>
                                            </div>
                                            <div className="named-areas-list-item-details">
                                                <span>Тип: {area.areaType}</span>
                                                <span>
                                                    Координаты: ({area.startRow + 1}, {area.startCol + 1}) - ({area.endRow + 1}, {area.endCol + 1})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="named-areas-list-item-actions">
                                            <button
                                                className="named-areas-action-button"
                                                onClick={() => handleEdit(area)}
                                                disabled={isEditDialogOpen}
                                                title="Редактировать"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="named-areas-action-button"
                                                onClick={() => handleDelete(area.name)}
                                                disabled={isEditDialogOpen}
                                                title="Удалить"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isEditDialogOpen && (
                <NamedAreaDialog
                    isOpen={isEditDialogOpen}
                    existingArea={editingArea}
                    existingNames={namedAreas.map(a => a.name)}
                    onSave={handleSaveArea}
                    onCancel={() => {
                        setIsEditDialogOpen(false);
                        setEditingArea(null);
                        setError(null);
                    }}
                />
            )}
        </>
    );
};

