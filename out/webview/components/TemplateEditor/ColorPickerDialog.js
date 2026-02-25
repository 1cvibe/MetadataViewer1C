"use strict";
/**
 * Диалог выбора цвета для текста или фона ячейки
 * Поддерживает HEX коды и стили 1С (style:NegativeTextColor)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorPickerDialog = void 0;
const react_1 = __importStar(require("react"));
require("./template-editor.css");
// Палитра основных цветов
const COLOR_PALETTE = [
    '#000000', '#FFFFFF', '#808080', '#C0C0C0',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#800000', '#008000',
    '#000080', '#808000', '#800080', '#008080',
    '#FF8080', '#80FF80', '#8080FF', '#FFCC00'
];
// Популярные стили 1С (из анализа макетов)
const STYLE_COLORS = [
    'style:NegativeTextColor',
    'style:SpecialTextColor',
    'style:ButtonTextColor',
    'style:ToolTipBackColor',
    'style:ToolTipForeground',
    'style:SelectionBackColor',
    'style:SelectionForeground',
    'style:WindowBackColor',
    'style:WindowForeground',
    'style:FieldBackColor',
    'style:FieldForeground'
];
const ColorPickerDialog = ({ isOpen, currentColor = '', title, onSave, onCancel }) => {
    const [hexColor, setHexColor] = (0, react_1.useState)('');
    const [styleColor, setStyleColor] = (0, react_1.useState)('');
    const [mode, setMode] = (0, react_1.useState)('hex');
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setError(null);
            if (currentColor) {
                if (currentColor.startsWith('style:')) {
                    setMode('style');
                    setStyleColor(currentColor);
                    setHexColor('');
                }
                else if (currentColor.startsWith('#')) {
                    setMode('hex');
                    setHexColor(currentColor.toUpperCase());
                    setStyleColor('');
                }
                else {
                    // Попытка интерпретировать как HEX без #
                    const hexMatch = currentColor.match(/^[0-9A-Fa-f]{6}$/);
                    if (hexMatch) {
                        setMode('hex');
                        setHexColor('#' + currentColor.toUpperCase());
                        setStyleColor('');
                    }
                    else {
                        setMode('hex');
                        setHexColor('');
                        setStyleColor('');
                    }
                }
            }
            else {
                setMode('hex');
                setHexColor('');
                setStyleColor('');
            }
        }
    }, [isOpen, currentColor]);
    const handleHexChange = (value) => {
        // Удаляем все символы кроме # и hex символов
        const cleaned = value.replace(/[^#0-9A-Fa-f]/g, '');
        if (cleaned.length <= 7) {
            setHexColor(cleaned.toUpperCase());
            setError(null);
        }
    };
    const handlePaletteClick = (color) => {
        setMode('hex');
        setHexColor(color.toUpperCase());
        setStyleColor('');
        setError(null);
    };
    const handleStyleClick = (style) => {
        setMode('style');
        setStyleColor(style);
        setHexColor('');
        setError(null);
    };
    const handleSave = () => {
        let colorToSave = '';
        if (mode === 'hex') {
            // Валидация HEX кода
            const hexRegex = /^#[0-9A-Fa-f]{6}$/;
            if (hexColor && !hexRegex.test(hexColor)) {
                setError('Некорректный HEX код. Используйте формат #RRGGBB');
                return;
            }
            colorToSave = hexColor || '';
        }
        else {
            // Валидация стиля
            if (styleColor && !styleColor.startsWith('style:')) {
                setError('Некорректный стиль. Должен начинаться с "style:"');
                return;
            }
            colorToSave = styleColor || '';
        }
        onSave(colorToSave);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };
    if (!isOpen) {
        return null;
    }
    return (react_1.default.createElement("div", { className: "color-picker-dialog-overlay", onClick: (e) => {
            if (e.target === e.currentTarget) {
                onCancel();
            }
        } },
        react_1.default.createElement("div", { className: "color-picker-dialog", onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown },
            react_1.default.createElement("div", { className: "color-picker-dialog-header" },
                react_1.default.createElement("h3", null, title),
                react_1.default.createElement("button", { className: "color-picker-dialog-close", onClick: onCancel, title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C (Esc)" }, "\u00D7")),
            react_1.default.createElement("div", { className: "color-picker-dialog-content" },
                react_1.default.createElement("div", { className: "color-picker-mode-selector" },
                    react_1.default.createElement("button", { className: `color-picker-mode-button ${mode === 'hex' ? 'active' : ''}`, onClick: () => {
                            setMode('hex');
                            setError(null);
                        } }, "HEX \u043A\u043E\u0434"),
                    react_1.default.createElement("button", { className: `color-picker-mode-button ${mode === 'style' ? 'active' : ''}`, onClick: () => {
                            setMode('style');
                            setError(null);
                        } }, "\u0421\u0442\u0438\u043B\u044C 1\u0421")),
                mode === 'hex' ? (react_1.default.createElement("div", { className: "color-picker-hex-section" },
                    react_1.default.createElement("div", { className: "color-picker-input-group" },
                        react_1.default.createElement("label", null, "HEX \u043A\u043E\u0434:"),
                        react_1.default.createElement("div", { className: "color-picker-hex-input-wrapper" },
                            react_1.default.createElement("input", { type: "text", value: hexColor, onChange: (e) => handleHexChange(e.target.value), placeholder: "#000000", className: "color-picker-input", maxLength: 7 }),
                            hexColor && (react_1.default.createElement("div", { className: "color-picker-preview", style: { backgroundColor: hexColor }, title: hexColor })))),
                    react_1.default.createElement("div", { className: "color-picker-palette-section" },
                        react_1.default.createElement("label", null, "\u041F\u0430\u043B\u0438\u0442\u0440\u0430:"),
                        react_1.default.createElement("div", { className: "color-picker-palette" }, COLOR_PALETTE.map((color) => (react_1.default.createElement("button", { key: color, className: `color-picker-palette-item ${hexColor.toUpperCase() === color.toUpperCase() ? 'selected' : ''}`, style: { backgroundColor: color }, onClick: () => handlePaletteClick(color), title: color }))))))) : (react_1.default.createElement("div", { className: "color-picker-style-section" },
                    react_1.default.createElement("div", { className: "color-picker-input-group" },
                        react_1.default.createElement("label", null, "\u0421\u0442\u0438\u043B\u044C 1\u0421:"),
                        react_1.default.createElement("input", { type: "text", value: styleColor, onChange: (e) => {
                                setStyleColor(e.target.value);
                                setError(null);
                            }, placeholder: "style:NegativeTextColor", className: "color-picker-input" })),
                    react_1.default.createElement("div", { className: "color-picker-style-list" },
                        react_1.default.createElement("label", null, "\u041F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438:"),
                        react_1.default.createElement("div", { className: "color-picker-style-buttons" }, STYLE_COLORS.map((style) => (react_1.default.createElement("button", { key: style, className: `color-picker-style-button ${styleColor === style ? 'selected' : ''}`, onClick: () => handleStyleClick(style) }, style))))))),
                error && (react_1.default.createElement("div", { className: "color-picker-error" }, error)),
                react_1.default.createElement("div", { className: "color-picker-dialog-actions" },
                    react_1.default.createElement("button", { className: "color-picker-button color-picker-button-cancel", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430"),
                    react_1.default.createElement("button", { className: "color-picker-button color-picker-button-save", onClick: handleSave }, "\u041E\u041A"))))));
};
exports.ColorPickerDialog = ColorPickerDialog;
//# sourceMappingURL=ColorPickerDialog.js.map