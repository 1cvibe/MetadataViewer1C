"use strict";
/**
 * Компонент для отображения таблицы признаков учета в режиме просмотра (readonly)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingFlagsView = void 0;
const react_1 = __importDefault(require("react"));
const AccountingFlagsView = ({ item }) => {
    const flags = item.AccountingFlags || [];
    if (flags.length === 0) {
        return null;
    }
    const enabledFlags = flags.filter(f => f.enabled);
    return (react_1.default.createElement("div", { className: "property-row", style: { marginTop: '8px' } },
        react_1.default.createElement("span", { className: "property-name" }, "\u041F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u0443\u0447\u0435\u0442\u0430:"),
        react_1.default.createElement("span", { className: "property-value" }, enabledFlags.length > 0
            ? enabledFlags.map(f => f.flagName).join(', ')
            : 'Нет')));
};
exports.AccountingFlagsView = AccountingFlagsView;
//# sourceMappingURL=AccountingFlagsView.js.map