import { GenerationIntent } from "../intent/IntentParser";

// Оставляем только AI-стратегию. Остальные отключены по требованию.
export type StrategyId = "ai";

export class IntentRouter {
  // Всегда маршрутизируем в AI-генератор, независимо от intent.kind
  route(_intent: GenerationIntent): StrategyId {
    return "ai";
  }
}

