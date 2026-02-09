/**
 * Диалог конструктора шрифта для ячейки
 * Позволяет выбрать семейство, размер и стили шрифта
 */

import React, { useState, useEffect } from 'react';
import { TemplateFont } from '../../../templatInterfaces';
import './template-editor.css';

interface FontBuilderDialogProps {
    isOpen: boolean;
    currentFont?: TemplateFont;
    onSave: (font: Partial<TemplateFont>) => void;
    onCancel: () => void;
}

// Популярные шрифты
const FONT_FAMILIES = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Tahoma',
    'Georgia',
    'Comic Sans MS',
    'Trebuchet MS',
    'Impact',
    'Lucida Console'
];

export const FontBuilderDialog: React.FC<FontBuilderDialogProps> = ({
    isOpen,
    currentFont,
    onSave,
    onCancel
}) => {
    const [faceName, setFaceName] = useState('');
    const [height, setHeight] = useState<number>(10);
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    const [strikeout, setStrikeout] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            if (currentFont) {
                setFaceName(currentFont['$_faceName'] || '');
                setHeight(currentFont['$_height'] || 10);
                setBold(currentFont['$_bold'] === 'true');
                setItalic(currentFont['$_italic'] === 'true');
                setUnderline(currentFont['$_underline'] === 'true');
                setStrikeout(currentFont['$_strikeout'] === 'true');
            } else {
                // Значения по умолчанию
                setFaceName('');
                setHeight(10);
                setBold(false);
                setItalic(false);
                setUnderline(false);
                setStrikeout(false);
            }
        }
    }, [isOpen, currentFont]);

    const handleHeightChange = (value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
            setHeight(numValue);
            setError(null);
        } else if (value === '') {
            setHeight(10);
        }
    };

    const handleSave = () => {
        // Валидация
        if (!faceName || faceName.trim() === '') {
            setError('Семейство шрифта не может быть пустым');
            return;
        }

        if (height <= 0 || height > 100) {
            setError('Размер шрифта должен быть от 1 до 100');
            return;
        }

        const fontData: Partial<TemplateFont> = {
            '$_faceName': faceName.trim(),
            '$_height': height,
            '$_bold': bold ? 'true' : 'false',
            '$_italic': italic ? 'true' : 'false',
            '$_underline': underline ? 'true' : 'false',
            '$_strikeout': strikeout ? 'true' : 'false'
        };

        onSave(fontData);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="font-builder-dialog-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div 
                className="font-builder-dialog"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="font-builder-dialog-header">
                    <h3>Конструктор шрифта</h3>
                    <button
                        className="font-builder-dialog-close"
                        onClick={onCancel}
                        title="Закрыть (Esc)"
                    >
                        ×
                    </button>
                </div>

                <div className="font-builder-dialog-content">
                    <div className="font-builder-field">
                        <label>Семейство шрифта:</label>
                        <select
                            value={faceName}
                            onChange={(e) => {
                                setFaceName(e.target.value);
                                setError(null);
                            }}
                            className="font-builder-input"
                        >
                            <option value="">Выберите шрифт...</option>
                            {FONT_FAMILIES.map((font) => (
                                <option key={font} value={font}>
                                    {font}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="font-builder-field">
                        <label>Размер шрифта (пункты):</label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            min="1"
                            max="100"
                            className="font-builder-input"
                        />
                    </div>

                    <div className="font-builder-field">
                        <label>Стили:</label>
                        <div className="font-builder-styles">
                            <label className="font-builder-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={bold}
                                    onChange={(e) => {
                                        setBold(e.target.checked);
                                        setError(null);
                                    }}
                                />
                                <strong>Жирный</strong>
                            </label>
                            <label className="font-builder-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={italic}
                                    onChange={(e) => {
                                        setItalic(e.target.checked);
                                        setError(null);
                                    }}
                                />
                                <em>Курсив</em>
                            </label>
                            <label className="font-builder-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={underline}
                                    onChange={(e) => {
                                        setUnderline(e.target.checked);
                                        setError(null);
                                    }}
                                />
                                <u>Подчеркнутый</u>
                            </label>
                            <label className="font-builder-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={strikeout}
                                    onChange={(e) => {
                                        setStrikeout(e.target.checked);
                                        setError(null);
                                    }}
                                />
                                <span style={{ textDecoration: 'line-through' }}>Зачеркнутый</span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="font-builder-error">
                            {error}
                        </div>
                    )}

                    <div className="font-builder-dialog-actions">
                        <button
                            className="font-builder-button font-builder-button-cancel"
                            onClick={onCancel}
                        >
                            Отмена
                        </button>
                        <button
                            className="font-builder-button font-builder-button-save"
                            onClick={handleSave}
                        >
                            ОК
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

