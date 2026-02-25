"use strict";
/**
 * Компонент переключения формата заполнения ячейки (параметр/шаблон)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FillPatternToggle = void 0;
const react_1 = __importDefault(require("react"));
require("./template-editor.css");
const FillPatternToggle = ({ fillPattern, onToggle, parameterName = '', templateText = '', onParameterNameChange, onTemplateTextChange }) => {
    const isParameter = fillPattern === 'parameter';
    const isTemplate = fillPattern === 'template';
    return (react_1.default.createElement("div", { className: "fill-pattern-toggle" },
        react_1.default.createElement("div", { className: "fill-pattern-toggle-header" },
            react_1.default.createElement("label", null, "\u0424\u043E\u0440\u043C\u0430\u0442 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F:"),
            react_1.default.createElement("div", { className: "fill-pattern-toggle-buttons" },
                react_1.default.createElement("button", { className: `fill-pattern-toggle-button ${isParameter ? 'active' : ''}`, onClick: () => onToggle('parameter'), title: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 - \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u043C\u044F \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430 [\u0418\u043C\u044F\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430]" }, "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440"),
                react_1.default.createElement("button", { className: `fill-pattern-toggle-button ${isTemplate ? 'active' : ''}`, onClick: () => onToggle('template'), title: "\u0428\u0430\u0431\u043B\u043E\u043D - \u0442\u0435\u043A\u0441\u0442 \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438 \u0440\u0430\u0441\u0447\u0435\u0442\u043D\u0430\u044F \u0446\u0435\u043D\u0430 - [\u0426\u0435\u043D\u0430]" }, "\u0428\u0430\u0431\u043B\u043E\u043D"))),
        isParameter && (react_1.default.createElement("div", { className: "fill-pattern-parameter-input" },
            react_1.default.createElement("label", null, "\u0418\u043C\u044F \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430:"),
            react_1.default.createElement("input", { type: "text", value: parameterName, onChange: (e) => onParameterNameChange?.(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430", className: "fill-pattern-input" }),
            react_1.default.createElement("div", { className: "fill-pattern-preview" },
                "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A: ",
                react_1.default.createElement("code", null,
                    "[",
                    parameterName || 'ИмяПараметра',
                    "]")))),
        isTemplate && (react_1.default.createElement("div", { className: "fill-pattern-template-input" },
            react_1.default.createElement("label", null, "\u0422\u0435\u043A\u0441\u0442 \u0448\u0430\u0431\u043B\u043E\u043D\u0430:"),
            react_1.default.createElement("textarea", { value: templateText, onChange: (e) => onTemplateTextChange?.(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438: \u0440\u0430\u0441\u0447\u0435\u0442\u043D\u0430\u044F \u0446\u0435\u043D\u0430 - [\u0426\u0435\u043D\u0430]", className: "fill-pattern-textarea", rows: 3 }),
            react_1.default.createElement("div", { className: "fill-pattern-preview" },
                "\u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A: ",
                react_1.default.createElement("code", null, templateText || 'текст [Параметр]'))))));
};
exports.FillPatternToggle = FillPatternToggle;
//# sourceMappingURL=FillPatternToggle.js.map