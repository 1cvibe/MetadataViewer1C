"use strict";
/**
 * Диалог конструктора шрифта для ячейки
 * Позволяет выбрать семейство, размер и стили шрифта
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
exports.FontBuilderDialog = void 0;
const react_1 = __importStar(require("react"));
require("./template-editor.css");
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
const FontBuilderDialog = ({ isOpen, currentFont, onSave, onCancel }) => {
    const [faceName, setFaceName] = (0, react_1.useState)('');
    const [height, setHeight] = (0, react_1.useState)(10);
    const [bold, setBold] = (0, react_1.useState)(false);
    const [italic, setItalic] = (0, react_1.useState)(false);
    const [underline, setUnderline] = (0, react_1.useState)(false);
    const [strikeout, setStrikeout] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setError(null);
            if (currentFont) {
                setFaceName(currentFont['$_faceName'] || '');
                setHeight(currentFont['$_height'] || 10);
                setBold(currentFont['$_bold'] === 'true');
                setItalic(currentFont['$_italic'] === 'true');
                setUnderline(currentFont['$_underline'] === 'true');
                setStrikeout(currentFont['$_strikeout'] === 'true');
            }
            else {
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
    const handleHeightChange = (value) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
            setHeight(numValue);
            setError(null);
        }
        else if (value === '') {
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
        const fontData = {
            '$_faceName': faceName.trim(),
            '$_height': height,
            '$_bold': bold ? 'true' : 'false',
            '$_italic': italic ? 'true' : 'false',
            '$_underline': underline ? 'true' : 'false',
            '$_strikeout': strikeout ? 'true' : 'false'
        };
        onSave(fontData);
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
    return (react_1.default.createElement("div", { className: "font-builder-dialog-overlay", onClick: (e) => {
            if (e.target === e.currentTarget) {
                onCancel();
            }
        } },
        react_1.default.createElement("div", { className: "font-builder-dialog", onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown },
            react_1.default.createElement("div", { className: "font-builder-dialog-header" },
                react_1.default.createElement("h3", null, "\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0448\u0440\u0438\u0444\u0442\u0430"),
                react_1.default.createElement("button", { className: "font-builder-dialog-close", onClick: onCancel, title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C (Esc)" }, "\u00D7")),
            react_1.default.createElement("div", { className: "font-builder-dialog-content" },
                react_1.default.createElement("div", { className: "font-builder-field" },
                    react_1.default.createElement("label", null, "\u0421\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u043E \u0448\u0440\u0438\u0444\u0442\u0430:"),
                    react_1.default.createElement("select", { value: faceName, onChange: (e) => {
                            setFaceName(e.target.value);
                            setError(null);
                        }, className: "font-builder-input" },
                        react_1.default.createElement("option", { value: "" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0448\u0440\u0438\u0444\u0442..."),
                        FONT_FAMILIES.map((font) => (react_1.default.createElement("option", { key: font, value: font }, font))))),
                react_1.default.createElement("div", { className: "font-builder-field" },
                    react_1.default.createElement("label", null, "\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430 (\u043F\u0443\u043D\u043A\u0442\u044B):"),
                    react_1.default.createElement("input", { type: "number", value: height, onChange: (e) => handleHeightChange(e.target.value), min: "1", max: "100", className: "font-builder-input" })),
                react_1.default.createElement("div", { className: "font-builder-field" },
                    react_1.default.createElement("label", null, "\u0421\u0442\u0438\u043B\u0438:"),
                    react_1.default.createElement("div", { className: "font-builder-styles" },
                        react_1.default.createElement("label", { className: "font-builder-checkbox-label" },
                            react_1.default.createElement("input", { type: "checkbox", checked: bold, onChange: (e) => {
                                    setBold(e.target.checked);
                                    setError(null);
                                } }),
                            react_1.default.createElement("strong", null, "\u0416\u0438\u0440\u043D\u044B\u0439")),
                        react_1.default.createElement("label", { className: "font-builder-checkbox-label" },
                            react_1.default.createElement("input", { type: "checkbox", checked: italic, onChange: (e) => {
                                    setItalic(e.target.checked);
                                    setError(null);
                                } }),
                            react_1.default.createElement("em", null, "\u041A\u0443\u0440\u0441\u0438\u0432")),
                        react_1.default.createElement("label", { className: "font-builder-checkbox-label" },
                            react_1.default.createElement("input", { type: "checkbox", checked: underline, onChange: (e) => {
                                    setUnderline(e.target.checked);
                                    setError(null);
                                } }),
                            react_1.default.createElement("u", null, "\u041F\u043E\u0434\u0447\u0435\u0440\u043A\u043D\u0443\u0442\u044B\u0439")),
                        react_1.default.createElement("label", { className: "font-builder-checkbox-label" },
                            react_1.default.createElement("input", { type: "checkbox", checked: strikeout, onChange: (e) => {
                                    setStrikeout(e.target.checked);
                                    setError(null);
                                } }),
                            react_1.default.createElement("span", { style: { textDecoration: 'line-through' } }, "\u0417\u0430\u0447\u0435\u0440\u043A\u043D\u0443\u0442\u044B\u0439")))),
                error && (react_1.default.createElement("div", { className: "font-builder-error" }, error)),
                react_1.default.createElement("div", { className: "font-builder-dialog-actions" },
                    react_1.default.createElement("button", { className: "font-builder-button font-builder-button-cancel", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430"),
                    react_1.default.createElement("button", { className: "font-builder-button font-builder-button-save", onClick: handleSave }, "\u041E\u041A"))))));
};
exports.FontBuilderDialog = FontBuilderDialog;
//# sourceMappingURL=FontBuilderDialog.js.map