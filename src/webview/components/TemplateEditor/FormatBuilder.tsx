/**
 * Конструктор формата чисел/дат для макетов 1С
 * Позволяет визуально создавать форматы для чисел, дат и логических значений
 */

import React, { useState } from 'react';
import { TemplateTextData } from '../../../templatInterfaces';
import './template-editor.css';

interface FormatBuilderProps {
    formatType: 'number' | 'date' | 'boolean' | 'string';
    existingFormat?: TemplateTextData;
    onSave: (format: TemplateTextData) => void;
    onCancel: () => void;
}

export const FormatBuilder: React.FC<FormatBuilderProps> = ({
    formatType,
    existingFormat,
    onSave,
    onCancel
}) => {
    const [numberFormat, setNumberFormat] = useState<string>(() => {
        if (existingFormat && formatType === 'number') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'N';
    });
    
    const [dateFormat, setDateFormat] = useState<string>(() => {
        if (existingFormat && formatType === 'date') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'ДФ="ДП"';
    });
    
    const [booleanFormat, setBooleanFormat] = useState<string>(() => {
        if (existingFormat && formatType === 'boolean') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'Л';
    });
    
    const [decimalPlaces, setDecimalPlaces] = useState<number>(() => {
        if (existingFormat && formatType === 'number' && numberFormat.startsWith('N(')) {
            const match = numberFormat.match(/N\((\d+)\)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return 0;
    });

    const handleSave = () => {
        let formatContent = '';
        
        switch (formatType) {
            case 'number':
                if (decimalPlaces > 0) {
                    formatContent = `N(${decimalPlaces})`;
                } else {
                    formatContent = numberFormat || 'N';
                }
                break;
            case 'date':
                formatContent = dateFormat || 'ДФ="ДП"';
                break;
            case 'boolean':
                formatContent = booleanFormat || 'Л';
                break;
            default:
                formatContent = '';
        }
        
        const format: TemplateTextData = {
            'v8:item': {
                'v8:lang': 'ru',
                'v8:content': formatContent
            }
        };
        
        onSave(format);
    };

    const renderNumberFormat = () => (
        <div className="format-builder-section">
            <label>Формат числа:</label>
            <div className="format-builder-options">
                <label>
                    <input
                        type="radio"
                        name="numberFormat"
                        value="N"
                        checked={numberFormat === 'N' && decimalPlaces === 0}
                        onChange={() => {
                            setNumberFormat('N');
                            setDecimalPlaces(0);
                        }}
                    />
                    N (без десятичных знаков)
                </label>
                <label>
                    <input
                        type="radio"
                        name="numberFormat"
                        value="N(0)"
                        checked={numberFormat === 'N(0)' || (numberFormat === 'N' && decimalPlaces === 0)}
                        onChange={() => {
                            setNumberFormat('N(0)');
                            setDecimalPlaces(0);
                        }}
                    />
                    N(0) (без десятичных знаков, явно)
                </label>
                <label>
                    <input
                        type="radio"
                        name="numberFormat"
                        value="N(custom)"
                        checked={decimalPlaces > 0}
                        onChange={() => {
                            setDecimalPlaces(2);
                            setNumberFormat(`N(${2})`);
                        }}
                    />
                    N(количество) (с десятичными знаками)
                </label>
                {decimalPlaces > 0 && (
                    <div className="format-builder-input-group">
                        <label>Количество десятичных знаков:</label>
                        <input
                            type="number"
                            min="0"
                            max="15"
                            value={decimalPlaces}
                            onChange={(e) => {
                                const places = parseInt(e.target.value) || 0;
                                setDecimalPlaces(places);
                                setNumberFormat(`N(${places})`);
                            }}
                            className="format-builder-input"
                        />
                    </div>
                )}
                <div className="format-builder-input-group">
                    <label>Произвольный формат:</label>
                    <input
                        type="text"
                        value={numberFormat}
                        onChange={(e) => {
                            setNumberFormat(e.target.value);
                            const match = e.target.value.match(/N\((\d+)\)/);
                            if (match) {
                                setDecimalPlaces(parseInt(match[1]));
                            } else {
                                setDecimalPlaces(0);
                            }
                        }}
                        placeholder="N, N(0), N(2) и т.д."
                        className="format-builder-input"
                    />
                </div>
            </div>
            <div className="format-builder-preview">
                <strong>Пример:</strong> {numberFormat && decimalPlaces > 0 ? `123.${'0'.repeat(decimalPlaces)}` : numberFormat === 'N' ? '123' : numberFormat}
            </div>
        </div>
    );

    const renderDateFormat = () => (
        <div className="format-builder-section">
            <label>Формат даты:</label>
            <div className="format-builder-options">
                <label>
                    <input
                        type="radio"
                        name="dateFormat"
                        value='ДФ="ДП"'
                        checked={dateFormat === 'ДФ="ДП"'}
                        onChange={() => setDateFormat('ДФ="ДП"')}
                    />
                    ДФ="ДП" (короткий формат даты)
                </label>
                <label>
                    <input
                        type="radio"
                        name="dateFormat"
                        value='ДФ="ДЛФ"'
                        checked={dateFormat === 'ДФ="ДЛФ"'}
                        onChange={() => setDateFormat('ДФ="ДЛФ"')}
                    />
                    ДФ="ДЛФ" (длинный формат даты)
                </label>
                <label>
                    <input
                        type="radio"
                        name="dateFormat"
                        value='ДФ="ДФ=д ММММ гггг"'
                        checked={dateFormat.includes('д ММММ')}
                        onChange={() => setDateFormat('ДФ="ДФ=д ММММ гггг"')}
                    />
                    ДФ="ДФ=д ММММ гггг" (полный формат)
                </label>
                <div className="format-builder-input-group">
                    <label>Произвольный формат:</label>
                    <input
                        type="text"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        placeholder='ДФ="ДФ=д ММММ гггг"'
                        className="format-builder-input"
                    />
                    <div className="format-builder-hint">
                        Примеры: ДФ="ДФ=д ММММ гггг", ДФ="ДФ=ДП ЧМ" (дата и время)
                    </div>
                </div>
            </div>
            <div className="format-builder-preview">
                <strong>Пример:</strong> {dateFormat || 'ДФ="ДП"'}
            </div>
        </div>
    );

    const renderBooleanFormat = () => (
        <div className="format-builder-section">
            <label>Формат логического значения:</label>
            <div className="format-builder-options">
                <label>
                    <input
                        type="radio"
                        name="booleanFormat"
                        value="Л"
                        checked={booleanFormat === 'Л'}
                        onChange={() => setBooleanFormat('Л')}
                    />
                    Л (Да/Нет)
                </label>
                <label>
                    <input
                        type="radio"
                        name="booleanFormat"
                        value="ИСТИНА;ЛОЖЬ"
                        checked={booleanFormat === 'ИСТИНА;ЛОЖЬ'}
                        onChange={() => setBooleanFormat('ИСТИНА;ЛОЖЬ')}
                    />
                    ИСТИНА;ЛОЖЬ
                </label>
                <div className="format-builder-input-group">
                    <label>Произвольный формат:</label>
                    <input
                        type="text"
                        value={booleanFormat}
                        onChange={(e) => setBooleanFormat(e.target.value)}
                        placeholder="Л, ИСТИНА;ЛОЖЬ и т.д."
                        className="format-builder-input"
                    />
                </div>
            </div>
            <div className="format-builder-preview">
                <strong>Пример:</strong> {booleanFormat || 'Л'}
            </div>
        </div>
    );

    return (
        <div className="format-builder-overlay" onClick={onCancel}>
            <div className="format-builder-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="format-builder-header">
                    <h3>Конструктор формата ({formatType === 'number' ? 'Число' : formatType === 'date' ? 'Дата' : formatType === 'boolean' ? 'Логическое' : 'Строка'})</h3>
                </div>
                <div className="format-builder-content">
                    {formatType === 'number' && renderNumberFormat()}
                    {formatType === 'date' && renderDateFormat()}
                    {formatType === 'boolean' && renderBooleanFormat()}
                    {formatType === 'string' && (
                        <div className="format-builder-section">
                            <label>Формат строки не требуется</label>
                        </div>
                    )}
                </div>
                <div className="format-builder-footer">
                    <button
                        className="format-builder-button format-builder-button-primary"
                        onClick={handleSave}
                    >
                        Сохранить
                    </button>
                    <button
                        className="format-builder-button"
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

