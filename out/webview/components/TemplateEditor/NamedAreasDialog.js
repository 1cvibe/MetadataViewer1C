"use strict";
/**
 * Диалог управления именованными областями
 * Отображает список всех именованных областей и позволяет создавать, редактировать и удалять их
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
exports.NamedAreasDialog = void 0;
const react_1 = __importStar(require("react"));
const NamedAreaDialog_1 = require("./NamedAreaDialog");
require("./template-editor.css");
const NamedAreasDialog = ({ isOpen, namedAreas, onCreate, onUpdate, onDelete, onCancel }) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = (0, react_1.useState)(false);
    const [editingArea, setEditingArea] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            setError(null);
            setIsEditDialogOpen(false);
            setEditingArea(null);
        }
    }, [isOpen, namedAreas]);
    const handleCreateNew = () => {
        setEditingArea(null);
        setIsEditDialogOpen(true);
        setError(null);
    };
    const handleEdit = (area) => {
        setEditingArea(area);
        setIsEditDialogOpen(true);
        setError(null);
    };
    const handleDelete = (name) => {
        if (confirm(`Удалить именованную область "${name}"?`)) {
            try {
                onDelete(name);
                setError(null);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка при удалении области');
            }
        }
    };
    const handleSaveArea = (area) => {
        try {
            if (editingArea) {
                // Редактирование существующей области
                onUpdate(editingArea.name, area);
            }
            else {
                // Создание новой области
                onCreate(area);
            }
            setIsEditDialogOpen(false);
            setEditingArea(null);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при сохранении области');
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isEditDialogOpen) {
            onCancel();
        }
    };
    if (!isOpen) {
        return null;
    }
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: "named-areas-dialog-overlay", onClick: (e) => {
                if (e.target === e.currentTarget && !isEditDialogOpen) {
                    onCancel();
                }
            } },
            react_1.default.createElement("div", { className: "named-areas-dialog", onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown },
                react_1.default.createElement("div", { className: "named-areas-dialog-header" },
                    react_1.default.createElement("h3", null, "\u0418\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438"),
                    react_1.default.createElement("button", { className: "named-areas-dialog-close", onClick: onCancel, title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C (Esc)", disabled: isEditDialogOpen }, "\u00D7")),
                react_1.default.createElement("div", { className: "named-areas-dialog-content" },
                    error && (react_1.default.createElement("div", { className: "named-areas-dialog-error" }, error)),
                    react_1.default.createElement("div", { className: "named-areas-list-header" },
                        react_1.default.createElement("button", { className: "named-areas-button-primary", onClick: handleCreateNew, disabled: isEditDialogOpen }, "\u2795 \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u043E\u0431\u043B\u0430\u0441\u0442\u044C")),
                    namedAreas.length === 0 ? (react_1.default.createElement("div", { className: "named-areas-empty" }, "\u0418\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442")) : (react_1.default.createElement("div", { className: "named-areas-list" }, namedAreas.map((area) => (react_1.default.createElement("div", { key: area.name, className: "named-areas-list-item" },
                        react_1.default.createElement("div", { className: "named-areas-list-item-info" },
                            react_1.default.createElement("div", { className: "named-areas-list-item-name" },
                                react_1.default.createElement("strong", null, area.name)),
                            react_1.default.createElement("div", { className: "named-areas-list-item-details" },
                                react_1.default.createElement("span", null,
                                    "\u0422\u0438\u043F: ",
                                    area.areaType),
                                react_1.default.createElement("span", null,
                                    "\u041A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B: (",
                                    area.startRow + 1,
                                    ", ",
                                    area.startCol + 1,
                                    ") - (",
                                    area.endRow + 1,
                                    ", ",
                                    area.endCol + 1,
                                    ")"))),
                        react_1.default.createElement("div", { className: "named-areas-list-item-actions" },
                            react_1.default.createElement("button", { className: "named-areas-action-button", onClick: () => handleEdit(area), disabled: isEditDialogOpen, title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }, "\u270F\uFE0F"),
                            react_1.default.createElement("button", { className: "named-areas-action-button", onClick: () => handleDelete(area.name), disabled: isEditDialogOpen, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }, "\uD83D\uDDD1\uFE0F")))))))))),
        isEditDialogOpen && (react_1.default.createElement(NamedAreaDialog_1.NamedAreaDialog, { isOpen: isEditDialogOpen, existingArea: editingArea, existingNames: namedAreas.map(a => a.name), onSave: handleSaveArea, onCancel: () => {
                setIsEditDialogOpen(false);
                setEditingArea(null);
                setError(null);
            } }))));
};
exports.NamedAreasDialog = NamedAreasDialog;
//# sourceMappingURL=NamedAreasDialog.js.map