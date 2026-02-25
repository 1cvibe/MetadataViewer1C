"use strict";
/**
 * Компонент XML редактора на основе Monaco Editor
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
exports.XmlEditor = void 0;
const react_1 = __importStar(require("react"));
const monaco = __importStar(require("monaco-editor"));
const XmlEditor = ({ value, onChange, language = 'xml' }) => {
    const containerRef = (0, react_1.useRef)(null);
    const editorRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!containerRef.current)
            return;
        // Создаем редактор
        const editor = monaco.editor.create(containerRef.current, {
            value: value || '',
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true
        });
        editorRef.current = editor;
        // Обработка изменений
        const disposable = editor.onDidChangeModelContent(() => {
            const currentValue = editor.getValue();
            onChange(currentValue);
        });
        return () => {
            disposable.dispose();
            editor.dispose();
        };
    }, []);
    // Обновляем значение при изменении пропса
    (0, react_1.useEffect)(() => {
        if (editorRef.current && editorRef.current.getValue() !== value) {
            editorRef.current.setValue(value || '');
        }
    }, [value]);
    return (react_1.default.createElement("div", { className: "xml-editor" },
        react_1.default.createElement("div", { className: "xml-editor-toolbar" },
            react_1.default.createElement("span", { className: "xml-editor-title" }, "XML")),
        react_1.default.createElement("div", { ref: containerRef, className: "xml-editor-container" })));
};
exports.XmlEditor = XmlEditor;
//# sourceMappingURL=XmlEditor.js.map