/**
 * Диалог создания/редактирования именованной области
 */

import React, { useState, useEffect } from 'react';
import { NamedArea } from '../../../templatInterfaces';
import './template-editor.css';

interface NamedAreaDialogProps {
    isOpen: boolean;
    existingArea?: NamedArea | null;
    defaultRange?: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    } | null;
    existingNames?: string[];
    onSave: (area: NamedArea) => void;
    onCancel: () => void;
}

export const NamedAreaDialog: React.FC<NamedAreaDialogProps> = ({
    isOpen,
    existingArea,
    defaultRange,
    existingNames = [],
    onSave,
    onCancel
}) => {
    const [name, setName] = useState('');
    const [areaType, setAreaType] = useState<'Rectangle' | 'Rows' | 'Columns'>('Rectangle');
    const [startRow, setStartRow] = useState(0);
    const [startCol, setStartCol] = useState(0);
    const [endRow, setEndRow] = useState(0);
    const [endCol, setEndCol] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (existingArea) {
                setName(existingArea.name);
                const type = existingArea.areaType as 'Rectangle' | 'Rows' | 'Columns';
                setAreaType(type);
                setStartRow(existingArea.startRow);
                setStartCol(existingArea.startCol);
                setEndRow(existingArea.endRow);
                setEndCol(existingArea.endCol);
                setError(null);
            } else if (defaultRange) {
                setName('');
                // Определяем тип по диапазону: если одна строка - Rows, если одна колонка - Columns
                const isSingleRow = defaultRange.startRow === defaultRange.endRow;
                const isSingleCol = defaultRange.startCol === defaultRange.endCol;
                
                if (isSingleRow && !isSingleCol) {
                    setAreaType('Rows');
                    setStartRow(defaultRange.startRow);
                    setEndRow(defaultRange.endRow);
                    setStartCol(-1);
                    setEndCol(-1);
                } else if (isSingleCol && !isSingleRow) {
                    setAreaType('Columns');
                    setStartCol(defaultRange.startCol);
                    setEndCol(defaultRange.endCol);
                    setStartRow(-1);
                    setEndRow(-1);
                } else {
                    setAreaType('Rectangle');
                    setStartRow(defaultRange.startRow);
                    setStartCol(defaultRange.startCol);
                    setEndRow(defaultRange.endRow);
                    setEndCol(defaultRange.endCol);
                }
                setError(null);
            }
        }
    }, [isOpen, existingArea, defaultRange]);
    
    // Автоматически обновляем координаты при изменении типа области
    useEffect(() => {
        if (areaType === 'Rows') {
            setStartCol(-1);
            setEndCol(-1);
        } else if (areaType === 'Columns') {
            setStartRow(-1);
            setEndRow(-1);
        }
    }, [areaType]);

    const handleSave = () => {
        // Валидация
        if (!name || name.trim() === '') {
            setError('Имя области не может быть пустым');
            return;
        }

        // Проверка уникальности имени (если редактируем, исключаем текущее имя)
        const trimmedName = name.trim();
        if (existingArea && existingArea.name === trimmedName) {
            // Редактируем существующую область - имя не изменилось
        } else if (existingNames.includes(trimmedName)) {
            setError(`Область с именем "${trimmedName}" уже существует`);
            return;
        }

        // Проверка допустимых символов
        if (!/^[a-zA-Zа-яА-Я0-9_]+$/.test(trimmedName)) {
            setError('Имя области может содержать только буквы, цифры и подчеркивание');
            return;
        }

        // Валидация координат в зависимости от типа области
        if (areaType === 'Rows') {
            if (startRow > endRow) {
                setError('Начальная строка должна быть меньше конечной');
                return;
            }
            if (startRow < 0 || endRow < 0) {
                setError('Номера строк не могут быть отрицательными');
                return;
            }
            // Координаты колонок должны быть -1
            if (startCol !== -1 || endCol !== -1) {
                setStartCol(-1);
                setEndCol(-1);
            }
        } else if (areaType === 'Columns') {
            if (startCol > endCol) {
                setError('Начальная колонка должна быть меньше конечной');
                return;
            }
            if (startCol < 0 || endCol < 0) {
                setError('Номера колонок не могут быть отрицательными (кроме -1)');
                return;
            }
            // Координаты строк должны быть -1
            if (startRow !== -1 || endRow !== -1) {
                setStartRow(-1);
                setEndRow(-1);
            }
        } else {
            // Rectangle: проверяем все координаты
            if (startRow > endRow || startCol > endCol) {
                setError('Начальные координаты должны быть меньше конечных');
                return;
            }
            if (startRow < 0 || endRow < 0 || startCol < 0 || endCol < 0) {
                setError('Координаты не могут быть отрицательными');
                return;
            }
        }

        const area: NamedArea = {
            name: trimmedName,
            areaType,
            startRow,
            startCol,
            endRow,
            endCol
        };

        onSave(area);
        setError(null);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="named-area-dialog-overlay" onClick={onCancel}>
            <div className="named-area-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="named-area-dialog-header">
                    <h3>{existingArea ? 'Редактировать именованную область' : 'Создать именованную область'}</h3>
                </div>
                <div className="named-area-dialog-content">
                    {error && (
                        <div className="named-area-dialog-error">
                            {error}
                        </div>
                    )}
                    
                    <div className="named-area-dialog-field">
                        <label>Имя области:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Введите имя области"
                            className="named-area-dialog-input"
                            autoFocus
                        />
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Тип области:</label>
                        <select
                            value={areaType}
                            onChange={(e) => setAreaType(e.target.value as 'Rectangle' | 'Rows' | 'Columns')}
                            className="named-area-dialog-select"
                        >
                            <option value="Rectangle">Прямоугольник</option>
                            <option value="Rows">Строки</option>
                            <option value="Columns">Колонки</option>
                        </select>
                        {areaType === 'Rows' && (
                            <div className="named-area-dialog-hint">
                                Именованная область для строк. Колонки автоматически устанавливаются в -1 (все колонки).
                            </div>
                        )}
                        {areaType === 'Columns' && (
                            <div className="named-area-dialog-hint">
                                Именованная область для колонок. Строки автоматически устанавливаются в -1 (все строки).
                            </div>
                        )}
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Начальная строка:</label>
                        <input
                            type="number"
                            value={startRow}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    setStartRow(val);
                                }
                            }}
                            min={areaType === 'Columns' ? -1 : 0}
                            disabled={areaType === 'Columns'}
                            className="named-area-dialog-input"
                            placeholder={areaType === 'Columns' ? '-1 (все строки)' : ''}
                        />
                        {areaType === 'Columns' && (
                            <div className="named-area-dialog-hint" style={{ fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' }}>
                                -1 (все строки)
                            </div>
                        )}
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Конечная строка:</label>
                        <input
                            type="number"
                            value={endRow}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    setEndRow(val);
                                }
                            }}
                            min={areaType === 'Columns' ? -1 : 0}
                            disabled={areaType === 'Columns'}
                            className="named-area-dialog-input"
                            placeholder={areaType === 'Columns' ? '-1 (все строки)' : ''}
                        />
                        {areaType === 'Columns' && (
                            <div className="named-area-dialog-hint" style={{ fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' }}>
                                -1 (все строки)
                            </div>
                        )}
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Начальная колонка:</label>
                        <input
                            type="number"
                            value={startCol}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    setStartCol(val);
                                }
                            }}
                            min={areaType === 'Rows' ? -1 : 0}
                            disabled={areaType === 'Rows'}
                            className="named-area-dialog-input"
                            placeholder={areaType === 'Rows' ? '-1 (все колонки)' : ''}
                        />
                        {areaType === 'Rows' && (
                            <div className="named-area-dialog-hint" style={{ fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' }}>
                                -1 (все колонки)
                            </div>
                        )}
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Конечная колонка:</label>
                        <input
                            type="number"
                            value={endCol}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    setEndCol(val);
                                }
                            }}
                            min={areaType === 'Rows' ? -1 : 0}
                            disabled={areaType === 'Rows'}
                            className="named-area-dialog-input"
                            placeholder={areaType === 'Rows' ? '-1 (все колонки)' : ''}
                        />
                        {areaType === 'Rows' && (
                            <div className="named-area-dialog-hint" style={{ fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' }}>
                                -1 (все колонки)
                            </div>
                        )}
                    </div>
                </div>
                <div className="named-area-dialog-footer">
                    <button
                        className="named-area-dialog-button named-area-dialog-button-primary"
                        onClick={handleSave}
                    >
                        Сохранить
                    </button>
                    <button
                        className="named-area-dialog-button"
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

