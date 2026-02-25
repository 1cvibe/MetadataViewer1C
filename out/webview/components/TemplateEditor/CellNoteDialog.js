"use strict";
/**
 * Диалог создания/редактирования примечания к ячейке
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
exports.CellNoteDialog = void 0;
const react_1 = __importStar(require("react"));
require("./template-editor.css");
const CellNoteDialog = ({ isOpen, existingNote, defaultCoordinates, onSave, onCancel }) => {
    const [text, setText] = (0, react_1.useState)('');
    const [beginRow, setBeginRow] = (0, react_1.useState)(0);
    const [endRow, setEndRow] = (0, react_1.useState)(0);
    const [beginColumn, setBeginColumn] = (0, react_1.useState)(0);
    const [endColumn, setEndColumn] = (0, react_1.useState)(0);
    const [beginRowOffset, setBeginRowOffset] = (0, react_1.useState)(0);
    const [endRowOffset, setEndRowOffset] = (0, react_1.useState)(0);
    const [beginColumnOffset, setBeginColumnOffset] = (0, react_1.useState)(0);
    const [endColumnOffset, setEndColumnOffset] = (0, react_1.useState)(0);
    const [autoSize, setAutoSize] = (0, react_1.useState)(true);
    const [pictureSize, setPictureSize] = (0, react_1.useState)('Stretch');
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
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
            }
            else if (defaultCoordinates) {
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
        const note = {
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
    return (react_1.default.createElement("div", { className: "named-area-dialog-overlay", onClick: onCancel },
        react_1.default.createElement("div", { className: "named-area-dialog", onClick: (e) => e.stopPropagation() },
            react_1.default.createElement("div", { className: "named-area-dialog-header" },
                react_1.default.createElement("h3", null, existingNote ? 'Редактировать примечание' : 'Создать примечание')),
            react_1.default.createElement("div", { className: "named-area-dialog-content" },
                error && (react_1.default.createElement("div", { className: "named-area-dialog-error" }, error)),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u0422\u0435\u043A\u0441\u0442 \u043F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F:"),
                    react_1.default.createElement("textarea", { value: text, onChange: (e) => setText(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F", className: "named-area-dialog-textarea", rows: 5, autoFocus: true })),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u041A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B \u043F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F:"),
                    react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430:"),
                            react_1.default.createElement("input", { type: "number", value: beginRow, onChange: (e) => setBeginRow(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u041A\u043E\u043D\u0435\u0447\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430:"),
                            react_1.default.createElement("input", { type: "number", value: endRow, onChange: (e) => setEndRow(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043B\u043E\u043D\u043A\u0430:"),
                            react_1.default.createElement("input", { type: "number", value: beginColumn, onChange: (e) => setBeginColumn(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u041A\u043E\u043D\u0435\u0447\u043D\u0430\u044F \u043A\u043E\u043B\u043E\u043D\u043A\u0430:"),
                            react_1.default.createElement("input", { type: "number", value: endColumn, onChange: (e) => setEndColumn(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u044F:"),
                    react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438:"),
                            react_1.default.createElement("input", { type: "number", value: beginRowOffset, onChange: (e) => setBeginRowOffset(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438:"),
                            react_1.default.createElement("input", { type: "number", value: endRowOffset, onChange: (e) => setEndRowOffset(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0439 \u043A\u043E\u043B\u043E\u043D\u043A\u0438:"),
                            react_1.default.createElement("input", { type: "number", value: beginColumnOffset, onChange: (e) => setBeginColumnOffset(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { style: { fontSize: 'calc(var(--vscode-font-size) - 1px)' } }, "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0439 \u043A\u043E\u043B\u043E\u043D\u043A\u0438:"),
                            react_1.default.createElement("input", { type: "number", value: endColumnOffset, onChange: (e) => setEndColumnOffset(parseInt(e.target.value) || 0), className: "named-area-dialog-input" })))),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null,
                        react_1.default.createElement("input", { type: "checkbox", checked: autoSize, onChange: (e) => setAutoSize(e.target.checked), style: { marginRight: '8px' } }),
                        "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440")),
                react_1.default.createElement("div", { className: "named-area-dialog-field" },
                    react_1.default.createElement("label", null, "\u0420\u0430\u0437\u043C\u0435\u0440 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F:"),
                    react_1.default.createElement("select", { value: pictureSize, onChange: (e) => setPictureSize(e.target.value), className: "named-area-dialog-select" },
                        react_1.default.createElement("option", { value: "Stretch" }, "\u0420\u0430\u0441\u0442\u044F\u043D\u0443\u0442\u044C"),
                        react_1.default.createElement("option", { value: "Fit" }, "\u0412\u043F\u0438\u0441\u0430\u0442\u044C"),
                        react_1.default.createElement("option", { value: "Original" }, "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439")))),
            react_1.default.createElement("div", { className: "named-area-dialog-footer" },
                react_1.default.createElement("button", { className: "named-area-dialog-button named-area-dialog-button-primary", onClick: handleSave }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"),
                react_1.default.createElement("button", { className: "named-area-dialog-button", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430")))));
};
exports.CellNoteDialog = CellNoteDialog;
//# sourceMappingURL=CellNoteDialog.js.map