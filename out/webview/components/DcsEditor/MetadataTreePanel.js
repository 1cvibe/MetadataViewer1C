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
exports.MetadataTreePanel = void 0;
const react_1 = __importStar(require("react"));
require("./MetadataTreePanel.css");
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
const MetadataTreePanel = ({ tree }) => {
    const [query, setQuery] = (0, react_1.useState)('');
    const [expanded, setExpanded] = (0, react_1.useState)({
        [tree.id]: true,
    });
    const filtered = (0, react_1.useMemo)(() => filterTree(tree, query), [tree, query]);
    const toggle = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };
    const renderNode = (n, depth) => {
        const hasChildren = Array.isArray(n.children) && n.children.length > 0;
        const isOpen = !!expanded[n.id];
        const canDrag = !!n.insertText;
        return (react_1.default.createElement("div", { key: n.id, className: "md-tree__node", style: { paddingLeft: 8 + depth * 14 } },
            react_1.default.createElement("div", { className: "md-tree__row" },
                hasChildren ? (react_1.default.createElement("button", { type: "button", className: "md-tree__toggle", onClick: () => toggle(n.id), title: isOpen ? 'Свернуть' : 'Развернуть' }, isOpen ? '▾' : '▸')) : (react_1.default.createElement("span", { className: "md-tree__spacer" })),
                react_1.default.createElement("div", { className: `md-tree__label ${canDrag ? 'is-draggable' : ''}`, draggable: canDrag, onDragStart: (e) => {
                        if (!n.insertText)
                            return;
                        // plain text fallback
                        e.dataTransfer.setData('text/plain', n.insertText);
                        // structured payload for alias-aware вставки
                        const insertText = String(n.insertText || '').trim();
                        const isVirtual = insertText.includes('(');
                        const parts = insertText.split('.');
                        const payload = { insertText, kind: n.kind };
                        if (n.kind === 'object' && parts.length >= 2) {
                            payload.type = 'table';
                            payload.tableKey = `${parts[0]}.${parts[1]}`;
                        }
                        else if (n.kind === 'member' && parts.length >= 3) {
                            payload.type = isVirtual ? 'virtual' : 'field';
                            payload.tableKey = `${parts[0]}.${parts[1]}`;
                            payload.name = parts.slice(2).join('.');
                        }
                        e.dataTransfer.setData('application/x-1c-md', JSON.stringify(payload));
                        e.dataTransfer.effectAllowed = 'copy';
                    }, title: n.insertText ? `Перетащите, чтобы вставить: ${n.insertText}` : n.label }, n.label)),
            hasChildren && isOpen ? (react_1.default.createElement("div", { className: "md-tree__children" }, n.children.map((c) => renderNode(c, depth + 1)))) : null));
    };
    return (react_1.default.createElement("div", { className: "md-tree" },
        react_1.default.createElement("div", { className: "md-tree__toolbar" },
            react_1.default.createElement("input", { className: "md-tree__search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0445\u2026" })),
        react_1.default.createElement("div", { className: "md-tree__content" }, renderNode(filtered, 0)),
        react_1.default.createElement("div", { className: "md-tree__hint" }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430: \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043E\u0431\u044A\u0435\u043A\u0442/\u043F\u043E\u043B\u0435 \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0434\u043B\u044F \u0432\u0441\u0442\u0430\u0432\u043A\u0438.")));
};
exports.MetadataTreePanel = MetadataTreePanel;
//# sourceMappingURL=MetadataTreePanel.js.map