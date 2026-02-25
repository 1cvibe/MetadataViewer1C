"use strict";
/**
 * Кастомный виджет для редактирования многоязычных полей
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
exports.MultilingualWidget = void 0;
const react_1 = __importStar(require("react"));
const MultilingualWidget = (props) => {
    const { value, onChange } = props;
    // Нормализуем значение: может быть строкой или объектом с v8:item
    const normalizeValue = (val) => {
        if (!val)
            return [{ lang: 'ru', content: '' }];
        if (typeof val === 'string') {
            return [{ lang: 'ru', content: val }];
        }
        if (val['v8:item']) {
            const items = Array.isArray(val['v8:item']) ? val['v8:item'] : [val['v8:item']];
            return items.map((item) => ({
                lang: item['v8:lang'] || 'ru',
                content: item['v8:content'] || ''
            }));
        }
        return [{ lang: 'ru', content: '' }];
    };
    const [items, setItems] = (0, react_1.useState)(normalizeValue(value));
    const handleItemChange = (index, field, newValue) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: newValue };
        setItems(newItems);
        // Преобразуем обратно в формат v8:item
        const v8Item = newItems.map(item => ({
            'v8:lang': item.lang,
            'v8:content': item.content
        }));
        onChange({
            'v8:item': v8Item.length === 1 ? v8Item[0] : v8Item
        });
    };
    const addItem = () => {
        setItems([...items, { lang: 'ru', content: '' }]);
    };
    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            const v8Item = newItems.map(item => ({
                'v8:lang': item.lang,
                'v8:content': item.content
            }));
            onChange({
                'v8:item': v8Item.length === 1 ? v8Item[0] : v8Item
            });
        }
    };
    return (react_1.default.createElement("div", { className: "multilingual-widget" },
        items.map((item, index) => (react_1.default.createElement("div", { key: index, className: "multilingual-item" },
            react_1.default.createElement("select", { value: item.lang, onChange: (e) => handleItemChange(index, 'lang', e.target.value), className: "multilingual-lang" },
                react_1.default.createElement("option", { value: "ru" }, "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"),
                react_1.default.createElement("option", { value: "en" }, "English"),
                react_1.default.createElement("option", { value: "uk" }, "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430"),
                react_1.default.createElement("option", { value: "kz" }, "\u049A\u0430\u0437\u0430\u049B")),
            react_1.default.createElement("input", { type: "text", value: item.content, onChange: (e) => handleItemChange(index, 'content', e.target.value), className: "multilingual-content", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435..." }),
            items.length > 1 && (react_1.default.createElement("button", { type: "button", onClick: () => removeItem(index), className: "multilingual-remove" }, "\u00D7"))))),
        react_1.default.createElement("button", { type: "button", onClick: addItem, className: "multilingual-add" }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044F\u0437\u044B\u043A")));
};
exports.MultilingualWidget = MultilingualWidget;
//# sourceMappingURL=MultilingualWidget.js.map