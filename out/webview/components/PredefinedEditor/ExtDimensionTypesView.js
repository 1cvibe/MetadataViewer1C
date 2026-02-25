"use strict";
/**
 * Компонент для отображения таблицы видов субконто в режиме просмотра (readonly)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtDimensionTypesView = void 0;
const react_1 = __importDefault(require("react"));
const ExtDimensionTypesView = ({ item }) => {
    const extDimTypes = item.ExtDimensionTypes || [];
    if (extDimTypes.length === 0) {
        return null;
    }
    return (react_1.default.createElement("div", { style: { marginTop: '8px' } },
        react_1.default.createElement("div", { className: "property-row" },
            react_1.default.createElement("span", { className: "property-name" }, "\u0412\u0438\u0434\u044B \u0441\u0443\u0431\u043A\u043E\u043D\u0442\u043E:"),
            react_1.default.createElement("span", { className: "property-value" }, extDimTypes.map(dt => dt.dimensionType).join(', '))),
        extDimTypes.length > 0 && (react_1.default.createElement("div", { style: { marginTop: '8px', fontSize: '11px', color: 'var(--vscode-descriptionForeground)' } },
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { borderBottom: '1px solid var(--vscode-panel-border)' } },
                        react_1.default.createElement("th", { style: { padding: '4px', textAlign: 'left', fontWeight: 'bold' } }, "\u0412\u0438\u0434 \u0441\u0443\u0431\u043A\u043E\u043D\u0442\u043E"),
                        react_1.default.createElement("th", { style: { padding: '4px', textAlign: 'center', fontWeight: 'bold' } }, "\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0431\u043E\u0440\u043E\u0442\u044B"))),
                react_1.default.createElement("tbody", null, extDimTypes.map((dimType, index) => (react_1.default.createElement("tr", { key: index, style: { borderBottom: '1px solid var(--vscode-panel-border)' } },
                    react_1.default.createElement("td", { style: { padding: '4px' } }, dimType.dimensionType),
                    react_1.default.createElement("td", { style: { padding: '4px', textAlign: 'center' } }, dimType.turnoverOnly ? 'Да' : 'Нет'))))))))));
};
exports.ExtDimensionTypesView = ExtDimensionTypesView;
//# sourceMappingURL=ExtDimensionTypesView.js.map