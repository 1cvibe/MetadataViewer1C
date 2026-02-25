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
exports.ArbitraryConditionModal = void 0;
const react_1 = __importStar(require("react"));
require("./ArbitraryConditionModal.css");
function normalize(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function filterTree(root, q) {
    const nq = normalize(q);
    if (!nq)
        return root;
    const walk = (n) => {
        const selfMatch = normalize(n.label).includes(nq);
        const kids = (n.children || []).map(walk).filter(Boolean);
        if (selfMatch || kids.length)
            return { ...n, children: kids };
        return null;
    };
    return (walk(root) || { ...root, children: [] });
}
function makeFunctionsTree() {
    const leaf = (id, label, insertText) => ({ id, label, insertText });
    return {
        id: 'root',
        label: 'Функции языка запросов',
        children: [
            {
                id: 'fn',
                label: 'Функции',
                children: [
                    {
                        id: 'fn-strings',
                        label: 'Функции работы со строками',
                        children: [
                            leaf('fn-str-len', 'ДЛИНА', 'ДЛИНА('),
                            leaf('fn-str-left', 'ЛЕВ', 'ЛЕВ('),
                            leaf('fn-str-right', 'ПРАВ', 'ПРАВ('),
                            leaf('fn-str-mid', 'СРЕД', 'СРЕД('),
                        ],
                    },
                    {
                        id: 'fn-dates',
                        label: 'Функции работы с датами',
                        children: [
                            leaf('fn-date-begin', 'НАЧАЛОПЕРИОДА', 'НАЧАЛОПЕРИОДА('),
                            leaf('fn-date-end', 'КОНЕЦПЕРИОДА', 'КОНЕЦПЕРИОДА('),
                            leaf('fn-date-dt', 'ДАТАВРЕМЯ', 'ДАТАВРЕМЯ('),
                        ],
                    },
                    {
                        id: 'fn-numbers',
                        label: 'Функции работы с числами',
                        children: [
                            leaf('fn-num-abs', 'ABS', 'ABS('),
                            leaf('fn-num-round', 'ОКРУГЛ', 'ОКРУГЛ('),
                        ],
                    },
                    {
                        id: 'fn-agg',
                        label: 'Агрегатные функции',
                        children: [
                            leaf('fn-agg-sum', 'СУММА', 'СУММА('),
                            leaf('fn-agg-count', 'КОЛИЧЕСТВО', 'КОЛИЧЕСТВО('),
                            leaf('fn-agg-avg', 'СРЕДНЕЕ', 'СРЕДНЕЕ('),
                            leaf('fn-agg-min', 'МИНИМУМ', 'МИНИМУМ('),
                            leaf('fn-agg-max', 'МАКСИМУМ', 'МАКСИМУМ('),
                        ],
                    },
                    {
                        id: 'fn-other',
                        label: 'Прочие функции',
                        children: [
                            leaf('fn-other-null', 'ЕСТЬNULL', 'ЕСТЬNULL('),
                            leaf('fn-other-value', 'ЗНАЧЕНИЕ', 'ЗНАЧЕНИЕ('),
                            leaf('fn-other-type', 'ТИП', 'ТИП('),
                        ],
                    },
                ],
            },
            {
                id: 'ops',
                label: 'Операторы',
                children: [
                    {
                        id: 'ops-arith',
                        label: 'Арифметические операторы',
                        children: [
                            leaf('op-plus', '+', ' + '),
                            leaf('op-minus', '-', ' - '),
                            leaf('op-mul', '*', ' * '),
                            leaf('op-div', '/', ' / '),
                        ],
                    },
                    {
                        id: 'ops-log',
                        label: 'Логические операторы',
                        children: [
                            leaf('op-and', 'И', ' И '),
                            leaf('op-or', 'ИЛИ', ' ИЛИ '),
                            leaf('op-not', 'НЕ', ' НЕ '),
                        ],
                    },
                    {
                        id: 'ops-other',
                        label: 'Прочие операторы',
                        children: [
                            leaf('op-eq', '=', ' = '),
                            leaf('op-ne', '<>', ' <> '),
                            leaf('op-gt', '>', ' > '),
                            leaf('op-lt', '<', ' < '),
                            leaf('op-ge', '>=', ' >= '),
                            leaf('op-le', '<=', ' <= '),
                            leaf('op-in', 'В', ' В '),
                            leaf('op-between', 'МЕЖДУ', ' МЕЖДУ '),
                            leaf('op-isnull', 'ЕСТЬ NULL', ' ЕСТЬ NULL'),
                        ],
                    },
                ],
            },
            {
                id: 'misc',
                label: 'Прочее',
                children: [
                    leaf('misc-true', 'ИСТИНА', 'ИСТИНА'),
                    leaf('misc-false', 'ЛОЖЬ', 'ЛОЖЬ'),
                    leaf('misc-null', 'NULL', 'NULL'),
                ],
            },
        ],
    };
}
function makeFieldsTree(fields) {
    const children = (fields || []).filter(Boolean).map((f) => ({ id: `field/${f}`, label: f, insertText: f }));
    return { id: 'fields', label: 'Поля', children };
}
const ArbitraryConditionModal = ({ isOpen, initialValue, fields, onSave, onCancel, }) => {
    const [value, setValue] = (0, react_1.useState)(initialValue || '');
    const textareaRef = (0, react_1.useRef)(null);
    const [fieldsQuery, setFieldsQuery] = (0, react_1.useState)('');
    const [funcQuery, setFuncQuery] = (0, react_1.useState)('');
    const [expanded, setExpanded] = (0, react_1.useState)({
        fields: true,
        root: true,
        fn: true,
        ops: true,
    });
    (0, react_1.useEffect)(() => {
        if (!isOpen)
            return;
        setValue(initialValue || '');
        setFieldsQuery('');
        setFuncQuery('');
        setExpanded({ fields: true, root: true, fn: true, ops: true });
        // фокус и позиция курсора
        setTimeout(() => {
            textareaRef.current?.focus();
            const len = textareaRef.current?.value?.length || 0;
            textareaRef.current?.setSelectionRange(len, len);
        }, 0);
    }, [isOpen, initialValue]);
    const insertIntoText = (insertText) => {
        const el = textareaRef.current;
        if (!el) {
            setValue((prev) => prev + insertText);
            return;
        }
        const src = String(value || '');
        const start = el.selectionStart ?? src.length;
        const end = el.selectionEnd ?? src.length;
        const before = src.slice(0, start);
        const after = src.slice(end);
        const next = before + insertText + after;
        setValue(next);
        // восстановим курсор после вставки
        setTimeout(() => {
            el.focus();
            const pos = start + insertText.length;
            el.setSelectionRange(pos, pos);
        }, 0);
    };
    const fieldsTree = (0, react_1.useMemo)(() => makeFieldsTree(fields || []), [fields]);
    const functionsTree = (0, react_1.useMemo)(() => makeFunctionsTree(), []);
    const filteredFields = (0, react_1.useMemo)(() => filterTree(fieldsTree, fieldsQuery), [fieldsTree, fieldsQuery]);
    const filteredFunctions = (0, react_1.useMemo)(() => filterTree(functionsTree, funcQuery), [functionsTree, funcQuery]);
    const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
    const renderNode = (n, depth) => {
        const hasChildren = Array.isArray(n.children) && n.children.length > 0;
        const isOpenNode = !!expanded[n.id];
        const isLeaf = !hasChildren;
        return (react_1.default.createElement("div", { key: n.id, className: "cond-tree__node", style: { paddingLeft: 8 + depth * 14 } },
            react_1.default.createElement("div", { className: "cond-tree__row" },
                hasChildren ? (react_1.default.createElement("button", { type: "button", className: "cond-tree__toggle", onClick: () => toggle(n.id), title: isOpenNode ? 'Свернуть' : 'Развернуть' }, isOpenNode ? '▾' : '▸')) : (react_1.default.createElement("span", { className: "cond-tree__spacer" })),
                react_1.default.createElement("div", { className: `cond-tree__label ${n.insertText ? 'is-insertable' : ''}`, title: n.insertText ? `Вставить: ${n.insertText}` : n.label, onDoubleClick: () => {
                        if (!n.insertText)
                            return;
                        insertIntoText(n.insertText);
                    }, onClick: () => {
                        if (!isLeaf || !n.insertText)
                            return;
                        insertIntoText(n.insertText);
                    } }, n.label)),
            hasChildren && isOpenNode ? (react_1.default.createElement("div", { className: "cond-tree__children" }, n.children.map((c) => renderNode(c, depth + 1)))) : null));
    };
    if (!isOpen)
        return null;
    return (react_1.default.createElement("div", { className: "cond-modal__overlay", onClick: onCancel },
        react_1.default.createElement("div", { className: "cond-modal", onClick: (e) => e.stopPropagation() },
            react_1.default.createElement("div", { className: "cond-modal__header" },
                react_1.default.createElement("div", { className: "cond-modal__title" }, "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u043E\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435"),
                react_1.default.createElement("button", { className: "cond-modal__close", type: "button", onClick: onCancel, title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }, "\u2715")),
            react_1.default.createElement("div", { className: "cond-modal__body" },
                react_1.default.createElement("div", { className: "cond-modal__top" },
                    react_1.default.createElement("div", { className: "cond-modal__panel" },
                        react_1.default.createElement("div", { className: "cond-modal__panel-title" }, "\u041F\u043E\u043B\u044F"),
                        react_1.default.createElement("input", { className: "cond-modal__search", value: fieldsQuery, onChange: (e) => setFieldsQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E\u043B\u0435\u0439\u2026" }),
                        react_1.default.createElement("div", { className: "cond-modal__tree" }, renderNode(filteredFields, 0))),
                    react_1.default.createElement("div", { className: "cond-modal__panel" },
                        react_1.default.createElement("div", { className: "cond-modal__panel-title" }, "\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u044F\u0437\u044B\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432"),
                        react_1.default.createElement("input", { className: "cond-modal__search", value: funcQuery, onChange: (e) => setFuncQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u0444\u0443\u043D\u043A\u0446\u0438\u0439\u2026" }),
                        react_1.default.createElement("div", { className: "cond-modal__tree" }, renderNode(filteredFunctions, 0)))),
                react_1.default.createElement("textarea", { ref: textareaRef, className: "cond-modal__textarea", value: value, onChange: (e) => setValue(e.target.value), spellCheck: false, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435..." })),
            react_1.default.createElement("div", { className: "cond-modal__footer" },
                react_1.default.createElement("button", { type: "button", className: "cond-modal__btn", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430"),
                react_1.default.createElement("button", { type: "button", className: "cond-modal__btn cond-modal__btn--primary", onClick: () => onSave(value) }, "OK")))));
};
exports.ArbitraryConditionModal = ArbitraryConditionModal;
//# sourceMappingURL=ArbitraryConditionModal.js.map