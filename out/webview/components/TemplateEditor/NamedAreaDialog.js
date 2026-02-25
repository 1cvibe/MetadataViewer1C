"use strict";
/**
 * Диалог создания/редактирования именованной области
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
exports.NamedAreaDialog = void 0;
const react_1 = __importStar(require("react"));
require("./template-editor.css");
const NamedAreaDialog = ({ isOpen, existingArea, defaultRange, existingNames = [], onSave, onCancel }) => {
    const [name, setName] = (0, react_1.useState)('');
    const [areaType, setAreaType] = (0, react_1.useState)('Rectangle');
    const [startRow, setStartRow] = (0, react_1.useState)(0);
    const [startCol, setStartCol] = (0, react_1.useState)(0);
    const [endRow, setEndRow] = (0, react_1.useState)(0);
    const [endCol, setEndCol] = (0, react_1.useState)(0);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            if (existingArea) {
                setName(existingArea.name);
                const type = existingArea.areaType;
                setAreaType(type);
                setStartRow(existingArea.startRow);
                setStartCol(existingArea.startCol);
                setEndRow(existingArea.endRow);
                setEndCol(existingArea.endCol);
                setError(null);
            }
            else if (defaultRange) {
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
                }
                else if (isSingleCol && !isSingleRow) {
                    setAreaType('Columns');
                    setStartCol(defaultRange.startCol);
                    setEndCol(defaultRange.endCol);
                    setStartRow(-1);
                    setEndRow(-1);
                }
                else {
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
    (0, react_1.useEffect)(() => {
        if (areaType === 'Rows') {
            setStartCol(-1);
            setEndCol(-1);
        }
        else if (areaType === 'Columns') {
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
        }
        else if (existingNames.includes(trimmedName)) {
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
        }
        else if (areaType === 'Columns') {
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
        }
        else {
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
        const area = {
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
    return (react_1.default.createElement("div", { className: "named-area-dialog-overlay", onClick: onCancel },
        react_1.default.createElement("div", { className: "named-area-dialog", onClick: (e) => e.stopPropagation() },
            react_1.default.createElement("div", { className: "named-area-dialog-header" },
                react_1.default.createElement("h3", null, existingArea ? 'Редактировать именованную область' : 'Создать именованную область')),
            react_1.default.createElement("div", { className: "named-area-dialog-content" },
                error && (react_1.default.createElement("div", { className: "named-area-dialog-error" }, error)),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u0418\u043C\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u0438:"),
                    react_1.default.createElement("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u0438", className: "named-area-dialog-input", autoFocus: true })),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u0422\u0438\u043F \u043E\u0431\u043B\u0430\u0441\u0442\u0438:"),
                    react_1.default.createElement("select", { value: areaType, onChange: (e) => setAreaType(e.target.value), className: "named-area-dialog-select" },
                        react_1.default.createElement("option", { value: "Rectangle" }, "\u041F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A"),
                        react_1.default.createElement("option", { value: "Rows" }, "\u0421\u0442\u0440\u043E\u043A\u0438"),
                        react_1.default.createElement("option", { value: "Columns" }, "\u041A\u043E\u043B\u043E\u043D\u043A\u0438")),
                    areaType === 'Rows' && (react_1.default.createElement("div", { className: "named-area-dialog-hint" }, "\u0418\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0434\u043B\u044F \u0441\u0442\u0440\u043E\u043A. \u041A\u043E\u043B\u043E\u043D\u043A\u0438 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0443\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432 -1 (\u0432\u0441\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438).")),
                    areaType === 'Columns' && (react_1.default.createElement("div", { className: "named-area-dialog-hint" }, "\u0418\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0434\u043B\u044F \u043A\u043E\u043B\u043E\u043D\u043E\u043A. \u0421\u0442\u0440\u043E\u043A\u0438 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0443\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432 -1 (\u0432\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438)."))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430:"),
                    react_1.default.createElement("input", { type: "number", value: startRow, onChange: (e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                setStartRow(val);
                            }
                        }, min: areaType === 'Columns' ? -1 : 0, disabled: areaType === 'Columns', className: "named-area-dialog-input", placeholder: areaType === 'Columns' ? '-1 (все строки)' : '' }),
                    areaType === 'Columns' && (react_1.default.createElement("div", { className: "named-area-dialog-hint", style: { fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' } }, "-1 (\u0432\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438)"))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u041A\u043E\u043D\u0435\u0447\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430:"),
                    react_1.default.createElement("input", { type: "number", value: endRow, onChange: (e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                setEndRow(val);
                            }
                        }, min: areaType === 'Columns' ? -1 : 0, disabled: areaType === 'Columns', className: "named-area-dialog-input", placeholder: areaType === 'Columns' ? '-1 (все строки)' : '' }),
                    areaType === 'Columns' && (react_1.default.createElement("div", { className: "named-area-dialog-hint", style: { fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' } }, "-1 (\u0432\u0441\u0435 \u0441\u0442\u0440\u043E\u043A\u0438)"))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043B\u043E\u043D\u043A\u0430:"),
                    react_1.default.createElement("input", { type: "number", value: startCol, onChange: (e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                setStartCol(val);
                            }
                        }, min: areaType === 'Rows' ? -1 : 0, disabled: areaType === 'Rows', className: "named-area-dialog-input", placeholder: areaType === 'Rows' ? '-1 (все колонки)' : '' }),
                    areaType === 'Rows' && (react_1.default.createElement("div", { className: "named-area-dialog-hint", style: { fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' } }, "-1 (\u0432\u0441\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438)"))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u041A\u043E\u043D\u0435\u0447\u043D\u0430\u044F \u043A\u043E\u043B\u043E\u043D\u043A\u0430:"),
                    react_1.default.createElement("input", { type: "number", value: endCol, onChange: (e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                setEndCol(val);
                            }
                        }, min: areaType === 'Rows' ? -1 : 0, disabled: areaType === 'Rows', className: "named-area-dialog-input", placeholder: areaType === 'Rows' ? '-1 (все колонки)' : '' }),
                    areaType === 'Rows' && (react_1.default.createElement("div", { className: "named-area-dialog-hint", style: { fontSize: 'calc(var(--vscode-font-size) - 2px)', marginTop: '4px' } }, "-1 (\u0432\u0441\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438)")))),
            react_1.default.createElement("div", { className: "named-area-dialog-footer" },
                react_1.default.createElement("button", { className: "named-area-dialog-button named-area-dialog-button-primary", onClick: handleSave }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"),
                react_1.default.createElement("button", { className: "named-area-dialog-button", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430")))));
};
exports.NamedAreaDialog = NamedAreaDialog;
//# sourceMappingURL=NamedAreaDialog.js.map