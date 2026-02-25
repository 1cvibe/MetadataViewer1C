"use strict";
/**
 * Редактор предопределенных элементов
 * Использует карточки для отображения элементов и TypeWidget для редактирования типов
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
exports.PredefinedEditorApp = void 0;
const react_1 = __importStar(require("react"));
const PredefinedTypeEditorModal_1 = require("./PredefinedTypeEditorModal");
const AccountingFlagsTable_1 = require("./AccountingFlagsTable");
const ExtDimensionTypesTable_1 = require("./ExtDimensionTypesTable");
const AccountingFlagsView_1 = require("./AccountingFlagsView");
const ExtDimensionTypesView_1 = require("./ExtDimensionTypesView");
require("../../styles/editor.css");
require("./PredefinedEditorApp.css");
const PredefinedEditorApp = ({ vscode }) => {
    const [items, setItems] = (0, react_1.useState)([]);
    const [editingIndex, setEditingIndex] = (0, react_1.useState)(null);
    const [editingItem, setEditingItem] = (0, react_1.useState)(null);
    const [editingChild, setEditingChild] = (0, react_1.useState)(null);
    const [showAddModal, setShowAddModal] = (0, react_1.useState)(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = (0, react_1.useState)(false);
    const [deleteIndex, setDeleteIndex] = (0, react_1.useState)(null);
    const [deleteChild, setDeleteChild] = (0, react_1.useState)(null);
    const [objectType, setObjectType] = (0, react_1.useState)('');
    const [metadata, setMetadata] = (0, react_1.useState)({
        registers: [],
        referenceTypes: []
    });
    const [chartOfAccountsData, setChartOfAccountsData] = (0, react_1.useState)(undefined);
    const [showTypeModal, setShowTypeModal] = (0, react_1.useState)(false);
    const [typeModalContext, setTypeModalContext] = (0, react_1.useState)({
        mode: 'add',
        currentType: ''
    });
    const [newItem, setNewItem] = (0, react_1.useState)({
        Name: '',
        Code: '',
        Description: '',
        Type: '',
        IsFolder: false
    });
    // Проверка, является ли объект планом видов характеристик
    const isChartOfCharacteristicTypes = (0, react_1.useMemo)(() => {
        return objectType === 'ChartOfCharacteristicTypes' ||
            objectType === 'План видов характеристик' ||
            objectType.includes('ChartOfCharacteristicTypes');
    }, [objectType]);
    // Проверка, является ли объект планом счетов
    const isChartOfAccounts = (0, react_1.useMemo)(() => {
        return objectType === 'ChartOfAccounts' ||
            objectType === 'План счетов' ||
            objectType.includes('ChartOfAccounts');
    }, [objectType]);
    // Обработка сообщений от extension
    (0, react_1.useEffect)(() => {
        const handleMessage = (event) => {
            const message = event.data;
            console.log('[PredefinedEditorApp] Получено сообщение:', message.type, 'элементов:', message.payload?.length || 0);
            if (message.type === 'init') {
                const initMsg = message;
                console.log('[PredefinedEditorApp] Инициализация с данными:', initMsg.payload);
                setItems(initMsg.payload || []);
                if (initMsg.objectType) {
                    setObjectType(initMsg.objectType);
                }
                if (initMsg.metadata) {
                    setMetadata(initMsg.metadata);
                }
                if (initMsg.chartOfAccountsData) {
                    console.log('[PredefinedEditorApp] Получены данные плана счетов:', {
                        accountingFlags: initMsg.chartOfAccountsData.accountingFlags?.length || 0,
                        extDimensionAccountingFlags: initMsg.chartOfAccountsData.extDimensionAccountingFlags?.length || 0,
                        dimensionTypes: initMsg.chartOfAccountsData.dimensionTypes?.length || 0
                    });
                    if (initMsg.chartOfAccountsData.dimensionTypes && initMsg.chartOfAccountsData.dimensionTypes.length > 0) {
                        console.log('[PredefinedEditorApp] Виды субконто:', initMsg.chartOfAccountsData.dimensionTypes.map(dt => ({
                            name: dt.name,
                            chartOfCharacteristicTypesName: dt.chartOfCharacteristicTypesName,
                            predefinedItemsCount: dt.predefinedItems?.length || 0
                        })));
                    }
                    setChartOfAccountsData(initMsg.chartOfAccountsData);
                }
                else {
                    console.warn('[PredefinedEditorApp] Данные плана счетов не получены');
                }
            }
            else if (message.type === 'saved') {
                if (message.payload?.success) {
                    setEditingIndex(null);
                    setEditingItem(null);
                    setShowAddModal(false);
                    setShowTypeModal(false);
                    setShowDeleteConfirm(false);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        // Запрашиваем данные при загрузке
        console.log('[PredefinedEditorApp] Компонент загружен, запрашиваем данные');
        vscode.postMessage({ type: 'requestData' });
        // Отправляем сообщение о готовности
        requestAnimationFrame(() => {
            setTimeout(() => {
                vscode.postMessage({ type: 'webviewReady' });
            }, 50);
        });
        return () => window.removeEventListener('message', handleMessage);
    }, [vscode]);
    const handleSave = () => {
        vscode.postMessage({ type: 'save', payload: items });
    };
    const handleAdd = () => {
        if (!newItem.Name || !newItem.Code) {
            alert('Заполните обязательные поля: Имя и Код');
            return;
        }
        // Убираем Type если это не план видов характеристик
        // Убираем поля плана счетов если это не план счетов
        const itemToAdd = {
            Name: newItem.Name,
            Code: newItem.Code,
            Description: newItem.Description || '',
            Type: isChartOfCharacteristicTypes ? (newItem.Type || '') : '',
            IsFolder: newItem.IsFolder || false,
            // Поля плана счетов
            AccountType: isChartOfAccounts ? newItem.AccountType : undefined,
            OffBalance: isChartOfAccounts ? newItem.OffBalance : undefined,
            Order: isChartOfAccounts ? newItem.Order : undefined,
            AccountingFlags: isChartOfAccounts && newItem.AccountingFlags ? newItem.AccountingFlags : undefined,
            ExtDimensionTypes: isChartOfAccounts && newItem.ExtDimensionTypes ? newItem.ExtDimensionTypes : undefined
        };
        const updatedItems = [...items, itemToAdd];
        setItems(updatedItems);
        vscode.postMessage({ type: 'addItem', payload: itemToAdd });
        setNewItem({ Name: '', Code: '', Description: '', Type: '', IsFolder: false });
        setShowAddModal(false);
    };
    /** Получить элемент по пути [rootIndex, childIndex1, childIndex2, ...] */
    const getItemByPath = (itemsList, path) => {
        if (path.length === 0)
            return null;
        let current = itemsList[path[0]];
        for (let i = 1; i < path.length; i++) {
            if (!current?.ChildItems?.Item)
                return null;
            current = current.ChildItems.Item[path[i]];
        }
        return current ?? null;
    };
    /** Обновить вложенный элемент по относительному пути (path без rootIndex) */
    const updateItemAtPath = (item, relPath, newValue) => {
        if (relPath.length === 0)
            return newValue;
        const [first, ...rest] = relPath;
        if (!item.ChildItems?.Item || first >= item.ChildItems.Item.length)
            return null;
        const updatedChildren = [...item.ChildItems.Item];
        const updatedChild = updateItemAtPath(updatedChildren[first], rest, newValue);
        if (!updatedChild)
            return null;
        updatedChildren[first] = updatedChild;
        return { ...item, ChildItems: { Item: updatedChildren } };
    };
    /** Удалить вложенный элемент по относительному пути */
    const removeItemAtPath = (item, relPath) => {
        if (relPath.length === 0)
            return null;
        if (relPath.length === 1) {
            const idx = relPath[0];
            if (!item.ChildItems?.Item || idx >= item.ChildItems.Item.length)
                return null;
            const updatedChildren = item.ChildItems.Item.filter((_, i) => i !== idx);
            if (updatedChildren.length === 0) {
                const { ChildItems, ...rest } = item;
                return rest;
            }
            return { ...item, ChildItems: { Item: updatedChildren } };
        }
        const [first, ...rest] = relPath;
        if (!item.ChildItems?.Item || first >= item.ChildItems.Item.length)
            return null;
        const updatedChildren = [...item.ChildItems.Item];
        const updatedChild = removeItemAtPath(updatedChildren[first], rest);
        if (updatedChild === null)
            return null;
        updatedChildren[first] = updatedChild;
        return { ...item, ChildItems: { Item: updatedChildren } };
    };
    const handleEdit = (index) => {
        setEditingIndex(index);
        setEditingItem({ ...items[index] });
        setEditingChild(null);
    };
    const handleEditChild = (path) => {
        if (path.length < 2)
            return;
        const childItem = getItemByPath(items, path);
        if (!childItem)
            return;
        const copiedItem = {
            ...childItem,
            AccountingFlags: childItem.AccountingFlags && childItem.AccountingFlags.length > 0
                ? childItem.AccountingFlags.map(flag => ({
                    flagName: flag.flagName,
                    enabled: flag.enabled,
                    ref: flag.ref
                }))
                : childItem.AccountingFlags,
            ExtDimensionTypes: childItem.ExtDimensionTypes && childItem.ExtDimensionTypes.length > 0
                ? childItem.ExtDimensionTypes.map(dimType => {
                    const copiedFlags = {};
                    if (dimType.flags) {
                        Object.entries(dimType.flags).forEach(([key, value]) => {
                            if (typeof value === 'boolean') {
                                copiedFlags[key] = value;
                            }
                            else if (value && typeof value === 'object' && 'enabled' in value) {
                                copiedFlags[key] = { enabled: value.enabled, ref: value.ref };
                            }
                        });
                    }
                    return {
                        dimensionType: dimType.dimensionType,
                        turnoverOnly: dimType.turnoverOnly,
                        flags: copiedFlags,
                        name: dimType.name
                    };
                })
                : childItem.ExtDimensionTypes
        };
        setEditingChild({ path });
        setEditingItem(copiedItem);
        setEditingIndex(null);
    };
    const handleUpdate = (updatedItem) => {
        if (!updatedItem.Name || !updatedItem.Code) {
            alert('Заполните обязательные поля: Имя и Код');
            return;
        }
        // Убираем Type если это не план видов характеристик
        if (!isChartOfCharacteristicTypes) {
            updatedItem.Type = '';
        }
        // Убираем поля плана счетов если это не план счетов
        if (!isChartOfAccounts) {
            updatedItem.AccountType = undefined;
            updatedItem.OffBalance = undefined;
            updatedItem.Order = undefined;
            updatedItem.AccountingFlags = undefined;
            updatedItem.ExtDimensionTypes = undefined;
        }
        if (editingChild && editingChild.path.length >= 2) {
            // Обновление вложенного элемента по пути
            const path = editingChild.path;
            const rootIndex = path[0];
            const updatedChildItem = {
                ...updatedItem,
                AccountingFlags: updatedItem.AccountingFlags
                    ? updatedItem.AccountingFlags.map(flag => ({ ...flag }))
                    : undefined,
                ExtDimensionTypes: updatedItem.ExtDimensionTypes
                    ? updatedItem.ExtDimensionTypes.map(dimType => ({
                        ...dimType,
                        flags: dimType.flags ? { ...dimType.flags } : {}
                    }))
                    : undefined
            };
            const updatedRootItem = updateItemAtPath(items[rootIndex], path.slice(1), updatedChildItem);
            if (updatedRootItem) {
                const updatedItems = [...items];
                updatedItems[rootIndex] = updatedRootItem;
                setItems(updatedItems);
                vscode.postMessage({
                    type: 'updateItem',
                    payload: { index: rootIndex, item: updatedRootItem }
                });
            }
            setEditingChild(null);
        }
        else {
            // Обновление обычного элемента
            const updatedItems = [...items];
            updatedItems[editingIndex] = updatedItem;
            setItems(updatedItems);
            vscode.postMessage({ type: 'updateItem', payload: { index: editingIndex, item: updatedItem } });
            setEditingIndex(null);
        }
        setEditingItem(null);
    };
    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingItem(null);
        setEditingChild(null);
    };
    const handleDelete = (index) => {
        setDeleteIndex(index);
        setDeleteChild(null);
        setShowDeleteConfirm(true);
    };
    const handleDeleteChild = (path) => {
        if (path.length < 2)
            return;
        setDeleteChild({ path });
        setDeleteIndex(null);
        setShowDeleteConfirm(true);
    };
    const handleConfirmDelete = () => {
        if (deleteChild && deleteChild.path.length >= 2) {
            const path = deleteChild.path;
            const rootIndex = path[0];
            const relPath = path.slice(1);
            const updatedRootItem = removeItemAtPath(items[rootIndex], relPath);
            if (updatedRootItem !== null) {
                const updatedItems = [...items];
                updatedItems[rootIndex] = updatedRootItem;
                setItems(updatedItems);
                vscode.postMessage({
                    type: 'updateItem',
                    payload: { index: rootIndex, item: updatedRootItem }
                });
            }
            setDeleteChild(null);
        }
        else if (deleteIndex !== null) {
            // Удаление обычного элемента
            const updatedItems = items.filter((_, i) => i !== deleteIndex);
            setItems(updatedItems);
            vscode.postMessage({ type: 'deleteItem', payload: { index: deleteIndex } });
            setDeleteIndex(null);
        }
        setShowDeleteConfirm(false);
    };
    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeleteIndex(null);
        setDeleteChild(null);
    };
    const handleOpenTypeModal = (mode, currentType = '') => {
        setTypeModalContext({ mode, currentType });
        setShowTypeModal(true);
    };
    const handleTypeSave = (selectedType) => {
        if (typeModalContext.mode === 'add') {
            setNewItem({ ...newItem, Type: selectedType });
        }
        else if (typeModalContext.mode === 'edit' && editingItem) {
            setEditingItem({ ...editingItem, Type: selectedType });
        }
        setShowTypeModal(false);
    };
    return (react_1.default.createElement("div", { className: "predefined-editor-wrapper" },
        react_1.default.createElement("div", { className: "predefined-editor" },
            react_1.default.createElement("div", { className: "editor-header" },
                react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    react_1.default.createElement("h2", null, "\u041F\u0440\u0435\u0434\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B"),
                    react_1.default.createElement("span", { style: { fontSize: '13px', color: 'var(--vscode-descriptionForeground)' } },
                        "\u042D\u043B\u0435\u043C\u0435\u043D\u0442\u044B (",
                        items.length,
                        ")")),
                react_1.default.createElement("div", { className: "header-actions" },
                    react_1.default.createElement("button", { className: "btn-add", onClick: () => setShowAddModal(true) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"),
                    react_1.default.createElement("button", { className: "btn-save", onClick: handleSave }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"))),
            react_1.default.createElement("div", { className: "editor-content" },
                showAddModal && (react_1.default.createElement("div", { className: "modal-overlay", onClick: () => {
                        setShowAddModal(false);
                        setNewItem({
                            Name: '',
                            Code: '',
                            Description: '',
                            Type: '',
                            IsFolder: false,
                            AccountType: undefined,
                            OffBalance: undefined,
                            Order: undefined,
                            AccountingFlags: undefined,
                            ExtDimensionTypes: undefined
                        });
                    } },
                    react_1.default.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() },
                        react_1.default.createElement("h3", null, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044D\u043B\u0435\u043C\u0435\u043D\u0442"),
                        react_1.default.createElement("div", { className: "modal-content" },
                            react_1.default.createElement("label", null,
                                "\u0418\u043C\u044F: *",
                                react_1.default.createElement("input", { type: "text", value: newItem.Name || '', onChange: (e) => setNewItem({ ...newItem, Name: e.target.value }) })),
                            react_1.default.createElement("label", null,
                                "\u041A\u043E\u0434: *",
                                react_1.default.createElement("input", { type: "text", value: newItem.Code || '', onChange: (e) => setNewItem({ ...newItem, Code: e.target.value }) })),
                            react_1.default.createElement("label", null,
                                "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435:",
                                react_1.default.createElement("input", { type: "text", value: newItem.Description || '', onChange: (e) => setNewItem({ ...newItem, Description: e.target.value }) })),
                            isChartOfCharacteristicTypes && (react_1.default.createElement("label", null,
                                "\u0422\u0438\u043F:",
                                react_1.default.createElement("div", { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                                    react_1.default.createElement("input", { type: "text", value: newItem.Type || '', readOnly: true, placeholder: "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430 \u0442\u0438\u043F\u0430", style: { flex: 1 } }),
                                    react_1.default.createElement("button", { type: "button", onClick: () => handleOpenTypeModal('add', newItem.Type || ''), title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0442\u0438\u043F\u043E\u0432", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0442\u0438\u043F\u043E\u0432", style: {
                                            padding: '6px 12px',
                                            background: 'var(--vscode-button-secondaryBackground)',
                                            color: 'var(--vscode-button-secondaryForeground)',
                                            border: '1px solid var(--vscode-button-border)',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        } }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u0438\u043F")))),
                            isChartOfAccounts && (react_1.default.createElement(react_1.default.Fragment, null,
                                react_1.default.createElement("label", null,
                                    "\u0412\u0438\u0434:",
                                    react_1.default.createElement("select", { value: newItem.AccountType || '', onChange: (e) => setNewItem({ ...newItem, AccountType: e.target.value }), style: {
                                            width: '100%',
                                            padding: '6px 12px',
                                            border: '1px solid var(--vscode-input-border)',
                                            background: 'var(--vscode-input-background)',
                                            color: 'var(--vscode-input-foreground)',
                                            borderRadius: '3px',
                                            fontSize: '12px'
                                        } },
                                        react_1.default.createElement("option", { value: "" }, "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"),
                                        react_1.default.createElement("option", { value: "Active" }, "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439"),
                                        react_1.default.createElement("option", { value: "Passive" }, "\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439"),
                                        react_1.default.createElement("option", { value: "ActivePassive" }, "\u0410\u043A\u0442\u0438\u0432\u043D\u043E-\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439"))),
                                react_1.default.createElement("label", { className: "checkbox-label" },
                                    react_1.default.createElement("input", { type: "checkbox", checked: newItem.OffBalance || false, onChange: (e) => setNewItem({ ...newItem, OffBalance: e.target.checked }) }),
                                    "\u0417\u0430\u0431\u0430\u043B\u0430\u043D\u0441\u043E\u0432\u044B\u0439"),
                                react_1.default.createElement("label", null,
                                    "\u041F\u043E\u0440\u044F\u0434\u043E\u043A:",
                                    react_1.default.createElement("input", { type: "text", value: newItem.Order || '', onChange: (e) => setNewItem({ ...newItem, Order: e.target.value }), placeholder: "\u041F\u043E\u0440\u044F\u0434\u043E\u043A" })),
                                chartOfAccountsData && (react_1.default.createElement(react_1.default.Fragment, null,
                                    react_1.default.createElement("div", { style: { marginTop: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' } }, "\u041F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u0443\u0447\u0435\u0442\u0430:"),
                                    react_1.default.createElement(AccountingFlagsTable_1.AccountingFlagsTable, { accountingFlags: chartOfAccountsData.accountingFlags, item: newItem, onChange: (item) => setNewItem(item) }),
                                    react_1.default.createElement("div", { style: { marginTop: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' } }, "\u0412\u0438\u0434\u044B \u0441\u0443\u0431\u043A\u043E\u043D\u0442\u043E:"),
                                    react_1.default.createElement(ExtDimensionTypesTable_1.ExtDimensionTypesTable, { dimensionTypes: chartOfAccountsData.dimensionTypes, extDimensionAccountingFlags: chartOfAccountsData.extDimensionAccountingFlags, item: newItem, onChange: (item) => setNewItem(item) }))))),
                            react_1.default.createElement("label", { className: "checkbox-label" },
                                react_1.default.createElement("input", { type: "checkbox", checked: newItem.IsFolder || false, onChange: (e) => setNewItem({ ...newItem, IsFolder: e.target.checked }) }),
                                "\u041F\u0430\u043F\u043A\u0430")),
                        react_1.default.createElement("div", { className: "modal-actions" },
                            react_1.default.createElement("button", { className: "btn-primary", onClick: handleAdd }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"),
                            react_1.default.createElement("button", { className: "btn-secondary", onClick: () => {
                                    setShowAddModal(false);
                                    setNewItem({
                                        Name: '',
                                        Code: '',
                                        Description: '',
                                        Type: '',
                                        IsFolder: false,
                                        AccountType: undefined,
                                        OffBalance: undefined,
                                        Order: undefined,
                                        AccountingFlags: undefined,
                                        ExtDimensionTypes: undefined
                                    });
                                } }, "\u041E\u0442\u043C\u0435\u043D\u0430"))))),
                items.length === 0 ? (react_1.default.createElement("div", { className: "empty-state" }, "\u0414\u043B\u044F \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u043E\u0431\u044A\u0435\u043A\u0442\u0430 \u043F\u0440\u0435\u0434\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u044B")) : (react_1.default.createElement("div", { className: "attributes-list" }, items.map((item, index) => {
                    const itemKey = item.id ? item.id : `${item.Code}-${item.Name}-${index}`;
                    return editingIndex === index ? (react_1.default.createElement(EditItemCard, { key: itemKey, item: editingItem, index: index, parentPath: [index], isChartOfCharacteristicTypes: isChartOfCharacteristicTypes, isChartOfAccounts: isChartOfAccounts, chartOfAccountsData: chartOfAccountsData, onSave: handleUpdate, onCancel: handleCancelEdit, onChange: setEditingItem, onOpenTypeModal: handleOpenTypeModal, onEditChild: handleEditChild, onDeleteChild: handleDeleteChild, editingChild: editingChild, editingItem: editingItem })) : (react_1.default.createElement(PredefinedItemCard, { key: itemKey, item: item, index: index, isChartOfAccounts: isChartOfAccounts, isChartOfCharacteristicTypes: isChartOfCharacteristicTypes, chartOfAccountsData: chartOfAccountsData, onEdit: handleEdit, onDelete: handleDelete, onEditChild: handleEditChild, onDeleteChild: handleDeleteChild, editingChild: editingChild, editingItem: editingItem, onSave: handleUpdate, onCancel: handleCancelEdit, onChange: setEditingItem, onOpenTypeModal: handleOpenTypeModal }));
                }))),
                showTypeModal && (react_1.default.createElement(PredefinedTypeEditorModal_1.PredefinedTypeEditorModal, { isOpen: showTypeModal, typeValue: typeModalContext.currentType || null, metadata: metadata, onClose: () => setShowTypeModal(false), onSave: handleTypeSave })),
                editingChild && editingItem && (react_1.default.createElement("div", { className: "modal-overlay", onClick: handleCancelEdit },
                    react_1.default.createElement("div", { className: "modal edit-item-modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' } },
                        react_1.default.createElement("h3", { style: { marginBottom: '16px' } },
                            "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435: ",
                            editingItem.Name || 'Элемент'),
                        react_1.default.createElement(EditItemCard, { item: editingItem, parentPath: editingChild.path, isChartOfCharacteristicTypes: isChartOfCharacteristicTypes, isChartOfAccounts: isChartOfAccounts, chartOfAccountsData: chartOfAccountsData, onSave: handleUpdate, onCancel: handleCancelEdit, onChange: setEditingItem, onOpenTypeModal: handleOpenTypeModal, onEditChild: handleEditChild, onDeleteChild: handleDeleteChild, editingChild: editingChild, editingItem: editingItem, showInModal: true })))),
                showDeleteConfirm && (react_1.default.createElement("div", { className: "modal-overlay", onClick: handleCancelDelete },
                    react_1.default.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: '400px' } },
                        react_1.default.createElement("h3", null, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F"),
                        react_1.default.createElement("div", { className: "modal-content" },
                            react_1.default.createElement("p", null, "\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u043E\u0442 \u044D\u043B\u0435\u043C\u0435\u043D\u0442?")),
                        react_1.default.createElement("div", { className: "modal-actions" },
                            react_1.default.createElement("button", { className: "btn-primary", onClick: handleConfirmDelete, style: { background: 'var(--vscode-errorForeground)' } }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"),
                            react_1.default.createElement("button", { className: "btn-secondary", onClick: handleCancelDelete }, "\u041E\u0442\u043C\u0435\u043D\u0430")))))))));
};
exports.PredefinedEditorApp = PredefinedEditorApp;
const PredefinedItemCard = ({ item, index, parentPath, isChartOfAccounts, isChartOfCharacteristicTypes, chartOfAccountsData, onEdit, onDelete, onEditChild, onDeleteChild, editingChild, editingItem, onSave, onCancel, onChange, onOpenTypeModal, isBeingEdited = false }) => {
    const childPath = parentPath !== undefined ? [...parentPath, index] : [index];
    const isChildCard = parentPath !== undefined;
    return (react_1.default.createElement("div", { className: "attribute-card", style: isBeingEdited ? { border: '2px solid var(--vscode-focusBorder)', boxShadow: '0 0 0 1px var(--vscode-focusBorder)' } : undefined },
        react_1.default.createElement("div", { className: "attribute-header" },
            react_1.default.createElement("h4", null,
                react_1.default.createElement("span", { style: { marginRight: '8px' } }, item.IsFolder ? '📁' : '📄'),
                item.Name),
            (index >= 0 || isChildCard) && (react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                react_1.default.createElement("button", { className: "btn-edit-type", type: "button", onClick: () => {
                        if (isChildCard && onEditChild && childPath.length >= 2) {
                            onEditChild(childPath);
                        }
                        else if (!isChildCard) {
                            onEdit(index);
                        }
                    }, title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", "aria-label": "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", style: {
                        padding: '4px 8px',
                        fontSize: '16px',
                        background: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        lineHeight: '1'
                    } }, "\u270E"),
                react_1.default.createElement("button", { className: "btn-edit-type", type: "button", onClick: () => {
                        if (isChildCard && onDeleteChild && childPath.length >= 2) {
                            onDeleteChild(childPath);
                        }
                        else if (!isChildCard) {
                            onDelete(index);
                        }
                    }, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", "aria-label": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", style: {
                        padding: '4px 8px',
                        fontSize: '16px',
                        background: 'var(--vscode-errorForeground)',
                        color: 'var(--vscode-button-foreground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        lineHeight: '1'
                    } }, "\u00D7")))),
        react_1.default.createElement("div", { className: "attribute-properties" },
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041A\u043E\u0434:"),
                react_1.default.createElement("span", { className: "property-value" }, item.Code)),
            item.Description && (react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435:"),
                react_1.default.createElement("span", { className: "property-value" }, item.Description))),
            isChartOfCharacteristicTypes && item.Type && (react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u0422\u0438\u043F:"),
                react_1.default.createElement("span", { className: "property-value", style: { fontFamily: 'monospace', fontSize: '11px' } }, item.Type.includes('|')
                    ? item.Type.split('|').map((t, idx) => (react_1.default.createElement("span", { key: idx },
                        t.trim(),
                        idx < item.Type.split('|').length - 1 && react_1.default.createElement("span", { style: { color: 'var(--vscode-descriptionForeground)' } }, " | "))))
                    : item.Type))),
            isChartOfAccounts && (react_1.default.createElement(react_1.default.Fragment, null,
                item.Parent && (react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C:"),
                    react_1.default.createElement("span", { className: "property-value" }, item.Parent))),
                item.AccountType && (react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0412\u0438\u0434:"),
                    react_1.default.createElement("span", { className: "property-value" }, item.AccountType))),
                item.OffBalance !== undefined && (react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0417\u0430\u0431\u0430\u043B\u0430\u043D\u0441\u043E\u0432\u044B\u0439:"),
                    react_1.default.createElement("span", { className: "property-value" }, item.OffBalance ? 'Да' : 'Нет'))),
                item.Order && (react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u041F\u043E\u0440\u044F\u0434\u043E\u043A:"),
                    react_1.default.createElement("span", { className: "property-value" }, item.Order))),
                react_1.default.createElement(AccountingFlagsView_1.AccountingFlagsView, { item: item }),
                react_1.default.createElement(ExtDimensionTypesView_1.ExtDimensionTypesView, { item: item }))),
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041F\u0430\u043F\u043A\u0430:"),
                react_1.default.createElement("span", { className: "property-value" }, item.IsFolder ? 'Да' : 'Нет')),
            item.ChildItems && item.ChildItems.Item && item.ChildItems.Item.length > 0 && (react_1.default.createElement("div", { style: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--vscode-panel-border)' } },
                react_1.default.createElement("div", { style: { fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' } },
                    "\u0414\u043E\u0447\u0435\u0440\u043D\u0438\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B (",
                    item.ChildItems.Item.length,
                    "):"),
                react_1.default.createElement("div", { className: "child-items-container", style: {
                        marginLeft: '16px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '8px'
                    } }, item.ChildItems.Item.map((childItem, childIndex) => {
                    const childPath = parentPath !== undefined ? [...parentPath, index, childIndex] : [index, childIndex];
                    const isEditing = !!(editingChild && editingChild.path.length === childPath.length &&
                        editingChild.path.every((p, i) => p === childPath[i]));
                    const childKey = childItem.id || `${childItem.Code}-${childItem.Name}-${childIndex}`;
                    return (react_1.default.createElement(PredefinedItemCard, { key: childKey, item: childItem, index: childIndex, parentPath: parentPath !== undefined ? [...parentPath, index] : [index], isChartOfAccounts: isChartOfAccounts, isChartOfCharacteristicTypes: isChartOfCharacteristicTypes, chartOfAccountsData: chartOfAccountsData, onEdit: () => { }, onDelete: () => { }, onEditChild: onEditChild, onDeleteChild: onDeleteChild, editingChild: editingChild, editingItem: editingItem, onSave: onSave, onCancel: onCancel, onChange: onChange, onOpenTypeModal: onOpenTypeModal, isBeingEdited: isEditing }));
                })))))));
};
const EditItemCard = ({ item, index = 0, parentPath, isChartOfCharacteristicTypes, isChartOfAccounts, chartOfAccountsData, onSave, onCancel, onChange, onOpenTypeModal, onEditChild, onDeleteChild, editingChild, editingItem, showInModal = false }) => {
    if (!item)
        return null;
    const handleSave = () => {
        if (!item.Name || !item.Code) {
            alert('Заполните обязательные поля: Имя и Код');
            return;
        }
        onSave(item);
    };
    return (react_1.default.createElement("div", { className: "attribute-card", style: {
            border: showInModal ? '1px solid var(--vscode-panel-border)' : '2px solid var(--vscode-focusBorder)',
            padding: showInModal ? '0' : undefined
        } },
        react_1.default.createElement("div", { className: "attribute-header" },
            !showInModal && react_1.default.createElement("h4", null, "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430"),
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                react_1.default.createElement("button", { className: "btn-edit-type", type: "button", onClick: handleSave, title: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C", "aria-label": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C", style: {
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    } }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"),
                react_1.default.createElement("button", { className: "btn-edit-type", type: "button", onClick: onCancel, title: "\u041E\u0442\u043C\u0435\u043D\u0430", "aria-label": "\u041E\u0442\u043C\u0435\u043D\u0430", style: {
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    } }, "\u041E\u0442\u043C\u0435\u043D\u0430"))),
        react_1.default.createElement("div", { className: "attribute-properties" },
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u0418\u043C\u044F: *"),
                react_1.default.createElement("input", { type: "text", value: item.Name || '', onChange: (e) => onChange({ ...item, Name: e.target.value }), placeholder: "\u0418\u043C\u044F", style: {
                        padding: '4px 8px',
                        border: '1px solid var(--vscode-input-border)',
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        flex: 1
                    } })),
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041A\u043E\u0434: *"),
                react_1.default.createElement("input", { type: "text", value: item.Code || '', onChange: (e) => onChange({ ...item, Code: e.target.value }), placeholder: "\u041A\u043E\u0434", style: {
                        padding: '4px 8px',
                        border: '1px solid var(--vscode-input-border)',
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        flex: 1
                    } })),
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435:"),
                react_1.default.createElement("input", { type: "text", value: item.Description || '', onChange: (e) => onChange({ ...item, Description: e.target.value }), placeholder: "\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435", style: {
                        padding: '4px 8px',
                        border: '1px solid var(--vscode-input-border)',
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        flex: 1
                    } })),
            isChartOfCharacteristicTypes && (react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u0422\u0438\u043F:"),
                react_1.default.createElement("div", { style: { display: 'flex', gap: '8px', alignItems: 'center', flex: 1 } },
                    react_1.default.createElement("input", { type: "text", value: item.Type || '', readOnly: true, placeholder: "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430 \u0442\u0438\u043F\u0430", style: {
                            padding: '4px 8px',
                            border: '1px solid var(--vscode-input-border)',
                            background: 'var(--vscode-input-background)',
                            color: 'var(--vscode-input-foreground)',
                            borderRadius: '3px',
                            fontSize: '12px',
                            flex: 1,
                            fontFamily: 'monospace'
                        } }),
                    react_1.default.createElement("button", { type: "button", onClick: () => onOpenTypeModal('edit', item.Type || ''), title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0442\u0438\u043F\u043E\u0432", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0442\u0438\u043F\u043E\u0432", style: {
                            padding: '4px 8px',
                            background: 'var(--vscode-button-secondaryBackground)',
                            color: 'var(--vscode-button-secondaryForeground)',
                            border: '1px solid var(--vscode-button-border)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                        } }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C")))),
            isChartOfAccounts && (react_1.default.createElement(react_1.default.Fragment, null,
                item.Parent && (react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C:"),
                    react_1.default.createElement("input", { type: "text", value: item.Parent, readOnly: true, style: {
                            padding: '4px 8px',
                            border: '1px solid var(--vscode-input-border)',
                            background: 'var(--vscode-input-background)',
                            color: 'var(--vscode-input-foreground)',
                            borderRadius: '3px',
                            fontSize: '12px',
                            flex: 1,
                            opacity: 0.7,
                            cursor: 'not-allowed'
                        } }))),
                react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0412\u0438\u0434:"),
                    react_1.default.createElement("select", { value: item.AccountType || '', onChange: (e) => onChange({ ...item, AccountType: e.target.value }), style: {
                            padding: '4px 8px',
                            border: '1px solid var(--vscode-input-border)',
                            background: 'var(--vscode-input-background)',
                            color: 'var(--vscode-input-foreground)',
                            borderRadius: '3px',
                            fontSize: '12px',
                            flex: 1
                        } },
                        react_1.default.createElement("option", { value: "" }, "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"),
                        react_1.default.createElement("option", { value: "Active" }, "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439"),
                        react_1.default.createElement("option", { value: "Passive" }, "\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439"),
                        react_1.default.createElement("option", { value: "ActivePassive" }, "\u0410\u043A\u0442\u0438\u0432\u043D\u043E-\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439"))),
                react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u0417\u0430\u0431\u0430\u043B\u0430\u043D\u0441\u043E\u0432\u044B\u0439:"),
                    react_1.default.createElement("label", { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
                        react_1.default.createElement("input", { type: "checkbox", checked: item.OffBalance || false, onChange: (e) => onChange({ ...item, OffBalance: e.target.checked }), style: { cursor: 'pointer' } }),
                        react_1.default.createElement("span", null, item.OffBalance ? 'Да' : 'Нет'))),
                react_1.default.createElement("div", { className: "property-row" },
                    react_1.default.createElement("span", { className: "property-name" }, "\u041F\u043E\u0440\u044F\u0434\u043E\u043A:"),
                    react_1.default.createElement("input", { type: "text", value: item.Order || '', onChange: (e) => onChange({ ...item, Order: e.target.value }), placeholder: "\u041F\u043E\u0440\u044F\u0434\u043E\u043A", style: {
                            padding: '4px 8px',
                            border: '1px solid var(--vscode-input-border)',
                            background: 'var(--vscode-input-background)',
                            color: 'var(--vscode-input-foreground)',
                            borderRadius: '3px',
                            fontSize: '12px',
                            flex: 1
                        } })),
                chartOfAccountsData && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(AccountingFlagsTable_1.AccountingFlagsTable, { accountingFlags: chartOfAccountsData.accountingFlags, item: item, onChange: onChange }),
                    react_1.default.createElement(ExtDimensionTypesTable_1.ExtDimensionTypesTable, { dimensionTypes: chartOfAccountsData.dimensionTypes, extDimensionAccountingFlags: chartOfAccountsData.extDimensionAccountingFlags, item: item, onChange: onChange }))))),
            react_1.default.createElement("div", { className: "property-row" },
                react_1.default.createElement("span", { className: "property-name" }, "\u041F\u0430\u043F\u043A\u0430:"),
                react_1.default.createElement("label", { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
                    react_1.default.createElement("input", { type: "checkbox", checked: item.IsFolder || false, onChange: (e) => onChange({ ...item, IsFolder: e.target.checked }), style: { cursor: 'pointer' } }),
                    react_1.default.createElement("span", null, item.IsFolder ? 'Да' : 'Нет'))),
            item.ChildItems && item.ChildItems.Item && item.ChildItems.Item.length > 0 && onEditChild && onDeleteChild && editingItem && onSave && onCancel && onChange && onOpenTypeModal && (react_1.default.createElement("div", { style: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--vscode-panel-border)' } },
                react_1.default.createElement("div", { style: { fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' } },
                    "\u0412\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B (",
                    item.ChildItems.Item.length,
                    "):"),
                react_1.default.createElement("div", { className: "child-items-container", style: {
                        marginLeft: '16px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '8px'
                    } }, item.ChildItems.Item.map((childItem, childIndex) => {
                    const itemPath = parentPath ?? [index];
                    const childPath = [...itemPath, childIndex];
                    const isEditing = !!(editingChild && editingChild.path.length === childPath.length &&
                        editingChild.path.every((p, i) => p === childPath[i]));
                    const childKey = childItem.id || `${childItem.Code}-${childItem.Name}-${childIndex}`;
                    return (react_1.default.createElement(PredefinedItemCard, { key: childKey, item: childItem, index: childIndex, parentPath: itemPath, isChartOfAccounts: isChartOfAccounts, isChartOfCharacteristicTypes: isChartOfCharacteristicTypes, chartOfAccountsData: chartOfAccountsData, onEdit: () => { }, onDelete: () => { }, onEditChild: onEditChild, onDeleteChild: onDeleteChild, editingChild: editingChild, editingItem: editingItem, onSave: onSave, onCancel: onCancel, onChange: onChange, onOpenTypeModal: onOpenTypeModal, isBeingEdited: isEditing }));
                })))))));
};
//# sourceMappingURL=PredefinedEditorApp.js.map