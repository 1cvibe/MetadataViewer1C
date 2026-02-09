export type IntentKind = "validation" | "bind" | "command" | "readonly" | "custom";

export interface GenerationIntent {
  kind: IntentKind;
  target?: string;
  options?: Record<string, any>;
  rawText: string;
  confidence: number;
}

export class IntentParser {
  parse(text: string): GenerationIntent {
    const normalized = this.normalize(text);

    return (
      // Преднастроенные стратегии (validation, bind, command, readonly) отключены по требованию.
      // Всегда возвращаем custom, чтобы дальше все обрабатывалось через AI-генератор.
      this.parseCustom(normalized)
    );
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/^@gen/, "")
      .replace(/[^A-zА-я0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Старые парсеры intent (validation, bind, command, readonly) удалены сознательно,
  // чтобы не поддерживать жестко заданные стратегии генерации.

  private parseCustom(text: string): GenerationIntent {
    return { kind: "custom", rawText: text, confidence: 0.2 };
  }
}

