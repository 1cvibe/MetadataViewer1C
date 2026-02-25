"use strict";
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
exports.QueryEditorModal = void 0;
const react_1 = __importStar(require("react"));
require("./QueryEditorModal.css");
const QueryEditorModal = ({ isOpen, queryText, onSave, onCancel, }) => {
    const [editedQuery, setEditedQuery] = (0, react_1.useState)(queryText);
    // Синхронизировать состояние при открытии модального окна
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setEditedQuery(queryText);
        }
    }, [isOpen, queryText]);
    if (!isOpen)
        return null;
    const handleSave = () => {
        onSave(editedQuery);
    };
    const handleKeyDown = (e) => {
        // Ctrl+Enter / Cmd+Enter = Сохранить
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        // Убрана обработка Escape - закрытие только по кнопке "Закрыть"
    };
    return (react_1.default.createElement("div", { className: "query-editor-modal-overlay", onClick: onCancel },
        react_1.default.createElement("div", { className: "query-editor-modal", onClick: (e) => e.stopPropagation() },
            react_1.default.createElement("div", { className: "query-editor-modal__header" },
                react_1.default.createElement("h3", null, "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0437\u0430\u043F\u0440\u043E\u0441\u0430"),
                react_1.default.createElement("button", { type: "button", className: "query-editor-modal__close", onClick: onCancel, title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }, "\u2715")),
            react_1.default.createElement("div", { className: "query-editor-modal__body" },
                react_1.default.createElement("textarea", { className: "query-editor-modal__textarea", value: editedQuery, onChange: (e) => setEditedQuery(e.target.value), onKeyDown: handleKeyDown, spellCheck: false, placeholder: "\u0422\u0435\u043A\u0441\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430...", autoFocus: true })),
            react_1.default.createElement("div", { className: "query-editor-modal__footer" },
                react_1.default.createElement("div", { className: "query-editor-modal__hint" }, "Ctrl+Enter - \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438 \u0430\u0432\u0442\u043E\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044F"),
                react_1.default.createElement("div", { className: "query-editor-modal__actions" },
                    react_1.default.createElement("button", { type: "button", className: "query-editor-modal__btn query-editor-modal__btn--secondary", onClick: onCancel }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"),
                    react_1.default.createElement("button", { type: "button", className: "query-editor-modal__btn query-editor-modal__btn--primary", onClick: handleSave }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438 \u0430\u0432\u0442\u043E\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044F"))))));
};
exports.QueryEditorModal = QueryEditorModal;
//# sourceMappingURL=QueryEditorModal.js.map