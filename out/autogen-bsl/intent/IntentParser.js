"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentParser = void 0;
class IntentParser {
    parse(text) {
        const normalized = this.normalize(text);
        return (
        // Преднастроенные стратегии (validation, bind, command, readonly) отключены по требованию.
        // Всегда возвращаем custom, чтобы дальше все обрабатывалось через AI-генератор.
        this.parseCustom(normalized));
    }
    normalize(text) {
        return text
            .toLowerCase()
            .replace(/^@gen/, "")
            .replace(/[^A-zА-я0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
    // Старые парсеры intent (validation, bind, command, readonly) удалены сознательно,
    // чтобы не поддерживать жестко заданные стратегии генерации.
    parseCustom(text) {
        return { kind: "custom", rawText: text, confidence: 0.2 };
    }
}
exports.IntentParser = IntentParser;
//# sourceMappingURL=IntentParser.js.map