"use strict";
/**
 * Компонент таблицы признаков учета для плана счетов
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingFlagsTable = void 0;
const react_1 = __importDefault(require("react"));
const AccountingFlagsTable = ({ accountingFlags, item, onChange }) => {
    const flags = item.AccountingFlags || [];
    const handleFlagNameChange = (index, flagName) => {
        const newFlags = [...flags];
        newFlags[index] = { ...newFlags[index], flagName };
        onChange({ ...item, AccountingFlags: newFlags });
    };
    const handleEnabledChange = (index, enabled) => {
        const newFlags = [...flags];
        newFlags[index] = { ...newFlags[index], enabled };
        onChange({ ...item, AccountingFlags: newFlags });
    };
    return (react_1.default.createElement("div", { style: { marginTop: '12px' } },
        react_1.default.createElement("div", { style: { marginBottom: '8px' } },
            react_1.default.createElement("label", { style: { fontWeight: 'bold', fontSize: '13px' } }, "\u041F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u0443\u0447\u0435\u0442\u0430:")),
        flags.length === 0 ? (react_1.default.createElement("div", { style: { fontSize: '12px', color: 'var(--vscode-descriptionForeground)', fontStyle: 'italic' } }, "\u041D\u0435\u0442 \u043F\u0440\u0438\u0437\u043D\u0430\u043A\u043E\u0432 \u0443\u0447\u0435\u0442\u0430")) : (react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { style: { borderBottom: '1px solid var(--vscode-panel-border)' } },
                    react_1.default.createElement("th", { style: { padding: '6px', textAlign: 'left', fontWeight: 'bold' } }, "\u041F\u0440\u0438\u0437\u043D\u0430\u043A \u0443\u0447\u0435\u0442\u0430"),
                    react_1.default.createElement("th", { style: { padding: '6px', textAlign: 'left', fontWeight: 'bold' } }, "\u0423\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C"))),
            react_1.default.createElement("tbody", null, flags.map((flag, index) => {
                // Создаем список опций, включая текущее значение, даже если его нет в accountingFlags
                const allFlagNames = new Set(accountingFlags);
                if (flag.flagName && !allFlagNames.has(flag.flagName)) {
                    allFlagNames.add(flag.flagName);
                }
                const flagOptions = Array.from(allFlagNames);
                return (react_1.default.createElement("tr", { key: index, style: { borderBottom: '1px solid var(--vscode-panel-border)' } },
                    react_1.default.createElement("td", { style: { padding: '6px' } },
                        react_1.default.createElement("select", { value: flag.flagName, onChange: (e) => handleFlagNameChange(index, e.target.value), style: {
                                width: '100%',
                                padding: '4px 8px',
                                border: '1px solid var(--vscode-input-border)',
                                background: 'var(--vscode-input-background)',
                                color: 'var(--vscode-input-foreground)',
                                borderRadius: '3px',
                                fontSize: '12px'
                            } }, flagOptions.map((flagName) => (react_1.default.createElement("option", { key: flagName, value: flagName }, flagName))))),
                    react_1.default.createElement("td", { style: { padding: '6px', textAlign: 'center' } },
                        react_1.default.createElement("input", { type: "checkbox", checked: flag.enabled, onChange: (e) => handleEnabledChange(index, e.target.checked), style: { cursor: 'pointer' } }))));
            }))))));
};
exports.AccountingFlagsTable = AccountingFlagsTable;
//# sourceMappingURL=AccountingFlagsTable.js.map