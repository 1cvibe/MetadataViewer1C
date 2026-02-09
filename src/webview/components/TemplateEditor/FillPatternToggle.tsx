/**
 * Компонент переключения формата заполнения ячейки (параметр/шаблон)
 */

import React from 'react';
import './template-editor.css';

interface FillPatternToggleProps {
    fillPattern: 'parameter' | 'template' | 'none';
    onToggle: (pattern: 'parameter' | 'template') => void;
    parameterName?: string;
    templateText?: string;
    onParameterNameChange?: (name: string) => void;
    onTemplateTextChange?: (text: string) => void;
}

export const FillPatternToggle: React.FC<FillPatternToggleProps> = ({
    fillPattern,
    onToggle,
    parameterName = '',
    templateText = '',
    onParameterNameChange,
    onTemplateTextChange
}) => {
    const isParameter = fillPattern === 'parameter';
    const isTemplate = fillPattern === 'template';

    return (
        <div className="fill-pattern-toggle">
            <div className="fill-pattern-toggle-header">
                <label>Формат заполнения:</label>
                <div className="fill-pattern-toggle-buttons">
                    <button
                        className={`fill-pattern-toggle-button ${isParameter ? 'active' : ''}`}
                        onClick={() => onToggle('parameter')}
                        title="Параметр - только имя параметра [ИмяПараметра]"
                    >
                        Параметр
                    </button>
                    <button
                        className={`fill-pattern-toggle-button ${isTemplate ? 'active' : ''}`}
                        onClick={() => onToggle('template')}
                        title="Шаблон - текст с параметрами расчетная цена - [Цена]"
                    >
                        Шаблон
                    </button>
                </div>
            </div>
            
            {isParameter && (
                <div className="fill-pattern-parameter-input">
                    <label>Имя параметра:</label>
                    <input
                        type="text"
                        value={parameterName}
                        onChange={(e) => onParameterNameChange?.(e.target.value)}
                        placeholder="Введите имя параметра"
                        className="fill-pattern-input"
                    />
                    <div className="fill-pattern-preview">
                        Отображается как: <code>[{parameterName || 'ИмяПараметра'}]</code>
                    </div>
                </div>
            )}
            
            {isTemplate && (
                <div className="fill-pattern-template-input">
                    <label>Текст шаблона:</label>
                    <textarea
                        value={templateText}
                        onChange={(e) => onTemplateTextChange?.(e.target.value)}
                        placeholder="Введите текст с параметрами: расчетная цена - [Цена]"
                        className="fill-pattern-textarea"
                        rows={3}
                    />
                    <div className="fill-pattern-preview">
                        Отображается как: <code>{templateText || 'текст [Параметр]'}</code>
                    </div>
                </div>
            )}
        </div>
    );
};

