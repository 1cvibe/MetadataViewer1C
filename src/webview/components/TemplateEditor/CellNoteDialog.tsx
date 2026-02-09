/**
 * Диалог создания/редактирования примечания к ячейке
 */

import React, { useState, useEffect } from 'react';
import './template-editor.css';

interface CellNoteDialogProps {
    isOpen: boolean;
    existingNote?: any;
    defaultCoordinates?: {
        beginRow: number;
        endRow: number;
        beginColumn: number;
        endColumn: number;
    };
    onSave: (note: any) => void;
    onCancel: () => void;
}

export const CellNoteDialog: React.FC<CellNoteDialogProps> = ({
    isOpen,
    existingNote,
    defaultCoordinates,
    onSave,
    onCancel
}) => {
    const [text, setText] = useState('');
    const [beginRow, setBeginRow] = useState(0);
    const [endRow, setEndRow] = useState(0);
    const [beginColumn, setBeginColumn] = useState(0);
    const [endColumn, setEndColumn] = useState(0);
    const [beginRowOffset, setBeginRowOffset] = useState(0);
    const [endRowOffset, setEndRowOffset] = useState(0);
    const [beginColumnOffset, setBeginColumnOffset] = useState(0);
    const [endColumnOffset, setEndColumnOffset] = useState(0);
    const [autoSize, setAutoSize] = useState(true);
    const [pictureSize, setPictureSize] = useState('Stretch');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (existingNote) {
                setText(existingNote.text?.['v8:item']?.['v8:content'] || 
                       existingNote.text?.['v8:content'] || 
                       existingNote.text || '');
                setBeginRow(existingNote.beginRow ?? 0);
                setEndRow(existingNote.endRow ?? 0);
                setBeginColumn(existingNote.beginColumn ?? 0);
                setEndColumn(existingNote.endColumn ?? 0);
                setBeginRowOffset(existingNote.beginRowOffset ?? 0);
                setEndRowOffset(existingNote.endRowOffset ?? 0);
                setBeginColumnOffset(existingNote.beginColumnOffset ?? 0);
                setEndColumnOffset(existingNote.endColumnOffset ?? 0);
                setAutoSize(existingNote.autoSize ?? true);
                setPictureSize(existingNote.pictureSize || 'Stretch');
                setError(null);
            } else if (defaultCoordinates) {
                setText('');
                setBeginRow(defaultCoordinates.beginRow);
                setEndRow(defaultCoordinates.endRow);
                setBeginColumn(defaultCoordinates.beginColumn);
                setEndColumn(defaultCoordinates.endColumn);
                setBeginRowOffset(0);
                setEndRowOffset(0);
                setBeginColumnOffset(0);
                setEndColumnOffset(0);
                setAutoSize(true);
                setPictureSize('Stretch');
                setError(null);
            }
        }
    }, [isOpen, existingNote, defaultCoordinates]);

    const handleSave = () => {
        // Валидация
        if (!text || text.trim() === '') {
            setError('Текст примечания не может быть пустым');
            return;
        }

        const note: any = {
            drawingType: 'Comment',
            id: existingNote?.id ?? 0,
            formatIndex: existingNote?.formatIndex ?? 0,
            text: {
                'v8:item': {
                    'v8:lang': 'ru',
                    'v8:content': text.trim()
                }
            },
            beginRow,
            endRow,
            beginColumn,
            endColumn,
            beginRowOffset,
            endRowOffset,
            beginColumnOffset,
            endColumnOffset,
            autoSize,
            pictureSize
        };

        onSave(note);
        setError(null);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="named-area-dialog-overlay" onClick={onCancel}>
            <div className="named-area-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="named-area-dialog-header">
                    <h3>{existingNote ? 'Редактировать примечание' : 'Создать примечание'}</h3>
                </div>
                <div className="named-area-dialog-content">
                    {error && (
                        <div className="named-area-dialog-error">
                            {error}
                        </div>
                    )}
                    
                    <div className="named-area-dialog-field">
                        <label>Текст примечания:</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Введите текст примечания"
                            className="named-area-dialog-textarea"
                            rows={5}
                            autoFocus
                        />
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Координаты примечания:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Начальная строка:</label>
                                <input
                                    type="number"
                                    value={beginRow}
                                    onChange={(e) => setBeginRow(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Конечная строка:</label>
                                <input
                                    type="number"
                                    value={endRow}
                                    onChange={(e) => setEndRow(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Начальная колонка:</label>
                                <input
                                    type="number"
                                    value={beginColumn}
                                    onChange={(e) => setBeginColumn(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Конечная колонка:</label>
                                <input
                                    type="number"
                                    value={endColumn}
                                    onChange={(e) => setEndColumn(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Смещения:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Смещение начальной строки:</label>
                                <input
                                    type="number"
                                    value={beginRowOffset}
                                    onChange={(e) => setBeginRowOffset(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Смещение конечной строки:</label>
                                <input
                                    type="number"
                                    value={endRowOffset}
                                    onChange={(e) => setEndRowOffset(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Смещение начальной колонки:</label>
                                <input
                                    type="number"
                                    value={beginColumnOffset}
                                    onChange={(e) => setBeginColumnOffset(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 'calc(var(--vscode-font-size) - 1px)' }}>Смещение конечной колонки:</label>
                                <input
                                    type="number"
                                    value={endColumnOffset}
                                    onChange={(e) => setEndColumnOffset(parseInt(e.target.value) || 0)}
                                    className="named-area-dialog-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="named-area-dialog-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={autoSize}
                                onChange={(e) => setAutoSize(e.target.checked)}
                                style={{ marginRight: '8px' }}
                            />
                            Автоматический размер
                        </label>
                    </div>

                    <div className="named-area-dialog-field">
                        <label>Размер изображения:</label>
                        <select
                            value={pictureSize}
                            onChange={(e) => setPictureSize(e.target.value)}
                            className="named-area-dialog-select"
                        >
                            <option value="Stretch">Растянуть</option>
                            <option value="Fit">Вписать</option>
                            <option value="Original">Оригинальный</option>
                        </select>
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

