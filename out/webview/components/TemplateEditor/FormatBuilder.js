"use strict";
/**
 * Конструктор формата чисел/дат для макетов 1С
 * Позволяет визуально создавать форматы для чисел, дат и логических значений
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
exports.FormatBuilder = void 0;
const react_1 = __importStar(require("react"));
require("./template-editor.css");
const FormatBuilder = ({ formatType, existingFormat, onSave, onCancel }) => {
    const [numberFormat, setNumberFormat] = (0, react_1.useState)(() => {
        if (existingFormat && formatType === 'number') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'N';
    });
    const [dateFormat, setDateFormat] = (0, react_1.useState)(() => {
        if (existingFormat && formatType === 'date') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'ДФ="ДП"';
    });
    const [booleanFormat, setBooleanFormat] = (0, react_1.useState)(() => {
        if (existingFormat && formatType === 'boolean') {
            const item = existingFormat['v8:item'];
            if (item && !Array.isArray(item) && item['v8:content']) {
                return item['v8:content'];
            }
        }
        return 'Л';
    });
    const [decimalPlaces, setDecimalPlaces] = (0, react_1.useState)(() => {
        if (existingFormat && formatType === 'number' && numberFormat.startsWith('N(')) {
            const match = numberFormat.match(/N\((\d+)\)/);
            if (match) {
                return parseInt(match[1]);
            }
        }
        return 0;
    });
    const handleSave = () => {
        let formatContent = '';
        switch (formatType) {
            case 'number':
                if (decimalPlaces > 0) {
                    formatContent = `N(${decimalPlaces})`;
                }
                else {
                    formatContent = numberFormat || 'N';
                }
                break;
            case 'date':
                formatContent = dateFormat || 'ДФ="ДП"';
                break;
            case 'boolean':
                formatContent = booleanFormat || 'Л';
                break;
            default:
                formatContent = '';
        }
        const format = {
            'v8:item': {
                'v8:lang': 'ru',
                'v8:content': formatContent
            }
        };
        onSave(format);
    };
    const renderNumberFormat = () => (react_1.default.createElement("div", { className: "format-builder-section" },
        react_1.default.createElement("label", null, "\u0424\u043E\u0440\u043C\u0430\u0442 \u0447\u0438\u0441\u043B\u0430:"),
        react_1.default.createElement("div", { className: "format-builder-options" },
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "numberFormat", value: "N", checked: numberFormat === 'N' && decimalPlaces === 0, onChange: () => {
                        setNumberFormat('N');
                        setDecimalPlaces(0);
                    } }),
                "N (\u0431\u0435\u0437 \u0434\u0435\u0441\u044F\u0442\u0438\u0447\u043D\u044B\u0445 \u0437\u043D\u0430\u043A\u043E\u0432)"),
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "numberFormat", value: "N(0)", checked: numberFormat === 'N(0)' || (numberFormat === 'N' && decimalPlaces === 0), onChange: () => {
                        setNumberFormat('N(0)');
                        setDecimalPlaces(0);
                    } }),
                "N(0) (\u0431\u0435\u0437 \u0434\u0435\u0441\u044F\u0442\u0438\u0447\u043D\u044B\u0445 \u0437\u043D\u0430\u043A\u043E\u0432, \u044F\u0432\u043D\u043E)"),
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "numberFormat", value: "N(custom)", checked: decimalPlaces > 0, onChange: () => {
                        setDecimalPlaces(2);
                        setNumberFormat(`N(${2})`);
                    } }),
                "N(\u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E) (\u0441 \u0434\u0435\u0441\u044F\u0442\u0438\u0447\u043D\u044B\u043C\u0438 \u0437\u043D\u0430\u043A\u0430\u043C\u0438)"),
            decimalPlaces > 0 && (react_1.default.createElement("div", { className: "format-builder-input-group" },
                react_1.default.createElement("label", null, "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0434\u0435\u0441\u044F\u0442\u0438\u0447\u043D\u044B\u0445 \u0437\u043D\u0430\u043A\u043E\u0432:"),
                react_1.default.createElement("input", { type: "number", min: "0", max: "15", value: decimalPlaces, onChange: (e) => {
                        const places = parseInt(e.target.value) || 0;
                        setDecimalPlaces(places);
                        setNumberFormat(`N(${places})`);
                    }, className: "format-builder-input" }))),
            react_1.default.createElement("div", { className: "format-builder-input-group" },
                react_1.default.createElement("label", null, "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442:"),
                react_1.default.createElement("input", { type: "text", value: numberFormat, onChange: (e) => {
                        setNumberFormat(e.target.value);
                        const match = e.target.value.match(/N\((\d+)\)/);
                        if (match) {
                            setDecimalPlaces(parseInt(match[1]));
                        }
                        else {
                            setDecimalPlaces(0);
                        }
                    }, placeholder: "N, N(0), N(2) \u0438 \u0442.\u0434.", className: "format-builder-input" }))),
        react_1.default.createElement("div", { className: "format-builder-preview" },
            react_1.default.createElement("strong", null, "\u041F\u0440\u0438\u043C\u0435\u0440:"),
            " ",
            numberFormat && decimalPlaces > 0 ? `123.${'0'.repeat(decimalPlaces)}` : numberFormat === 'N' ? '123' : numberFormat)));
    const renderDateFormat = () => (react_1.default.createElement("div", { className: "format-builder-section" },
        react_1.default.createElement("label", null, "\u0424\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B:"),
        react_1.default.createElement("div", { className: "format-builder-options" },
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "dateFormat", value: '\u0414\u0424="\u0414\u041F"', checked: dateFormat === 'ДФ="ДП"', onChange: () => setDateFormat('ДФ="ДП"') }),
                "\u0414\u0424=\"\u0414\u041F\" (\u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B)"),
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "dateFormat", value: '\u0414\u0424="\u0414\u041B\u0424"', checked: dateFormat === 'ДФ="ДЛФ"', onChange: () => setDateFormat('ДФ="ДЛФ"') }),
                "\u0414\u0424=\"\u0414\u041B\u0424\" (\u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B)"),
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "dateFormat", value: '\u0414\u0424="\u0414\u0424=\u0434 \u041C\u041C\u041C\u041C \u0433\u0433\u0433\u0433"', checked: dateFormat.includes('д ММММ'), onChange: () => setDateFormat('ДФ="ДФ=д ММММ гггг"') }),
                "\u0414\u0424=\"\u0414\u0424=\u0434 \u041C\u041C\u041C\u041C \u0433\u0433\u0433\u0433\" (\u043F\u043E\u043B\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442)"),
            react_1.default.createElement("div", { className: "format-builder-input-group" },
                react_1.default.createElement("label", null, "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442:"),
                react_1.default.createElement("input", { type: "text", value: dateFormat, onChange: (e) => setDateFormat(e.target.value), placeholder: '\u0414\u0424="\u0414\u0424=\u0434 \u041C\u041C\u041C\u041C \u0433\u0433\u0433\u0433"', className: "format-builder-input" }),
                react_1.default.createElement("div", { className: "format-builder-hint" }, "\u041F\u0440\u0438\u043C\u0435\u0440\u044B: \u0414\u0424=\"\u0414\u0424=\u0434 \u041C\u041C\u041C\u041C \u0433\u0433\u0433\u0433\", \u0414\u0424=\"\u0414\u0424=\u0414\u041F \u0427\u041C\" (\u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F)"))),
        react_1.default.createElement("div", { className: "format-builder-preview" },
            react_1.default.createElement("strong", null, "\u041F\u0440\u0438\u043C\u0435\u0440:"),
            " ",
            dateFormat || 'ДФ="ДП"')));
    const renderBooleanFormat = () => (react_1.default.createElement("div", { className: "format-builder-section" },
        react_1.default.createElement("label", null, "\u0424\u043E\u0440\u043C\u0430\u0442 \u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F:"),
        react_1.default.createElement("div", { className: "format-builder-options" },
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "booleanFormat", value: "\u041B", checked: booleanFormat === 'Л', onChange: () => setBooleanFormat('Л') }),
                "\u041B (\u0414\u0430/\u041D\u0435\u0442)"),
            react_1.default.createElement("label", null,
                react_1.default.createElement("input", { type: "radio", name: "booleanFormat", value: "\u0418\u0421\u0422\u0418\u041D\u0410;\u041B\u041E\u0416\u042C", checked: booleanFormat === 'ИСТИНА;ЛОЖЬ', onChange: () => setBooleanFormat('ИСТИНА;ЛОЖЬ') }),
                "\u0418\u0421\u0422\u0418\u041D\u0410;\u041B\u041E\u0416\u042C"),
            react_1.default.createElement("div", { className: "format-builder-input-group" },
                react_1.default.createElement("label", null, "\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442:"),
                react_1.default.createElement("input", { type: "text", value: booleanFormat, onChange: (e) => setBooleanFormat(e.target.value), placeholder: "\u041B, \u0418\u0421\u0422\u0418\u041D\u0410;\u041B\u041E\u0416\u042C \u0438 \u0442.\u0434.", className: "format-builder-input" }))),
        react_1.default.createElement("div", { className: "format-builder-preview" },
            react_1.default.createElement("strong", null, "\u041F\u0440\u0438\u043C\u0435\u0440:"),
            " ",
            booleanFormat || 'Л')));
    return (react_1.default.createElement("div", { className: "format-builder-overlay", onClick: onCancel },
        react_1.default.createElement("div", { className: "format-builder-dialog", onClick: (e) => e.stopPropagation() },
            react_1.default.createElement("div", { className: "format-builder-header" },
                react_1.default.createElement("h3", null,
                    "\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0444\u043E\u0440\u043C\u0430\u0442\u0430 (",
                    formatType === 'number' ? 'Число' : formatType === 'date' ? 'Дата' : formatType === 'boolean' ? 'Логическое' : 'Строка',
                    ")")),
            react_1.default.createElement("div", { className: "format-builder-content" },
                formatType === 'number' && renderNumberFormat(),
                formatType === 'date' && renderDateFormat(),
                formatType === 'boolean' && renderBooleanFormat(),
                formatType === 'string' && (react_1.default.createElement("div", { className: "format-builder-section" },
                    react_1.default.createElement("label", null, "\u0424\u043E\u0440\u043C\u0430\u0442 \u0441\u0442\u0440\u043E\u043A\u0438 \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F")))),
            react_1.default.createElement("div", { className: "format-builder-footer" },
                react_1.default.createElement("button", { className: "format-builder-button format-builder-button-primary", onClick: handleSave }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"),
                react_1.default.createElement("button", { className: "format-builder-button", onClick: onCancel }, "\u041E\u0442\u043C\u0435\u043D\u0430")))));
};
exports.FormatBuilder = FormatBuilder;
//# sourceMappingURL=FormatBuilder.js.map