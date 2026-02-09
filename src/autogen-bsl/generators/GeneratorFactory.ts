import { BaseGenerator } from './BaseGenerator';
import { AIGenerator } from './AIGenerator';
import { StrategyId } from '../routing/IntentRouter';

/**
 * Фабрика генераторов кода.
 * По требованию заказчика отключены преднастроенные стратегии (validation, bind, command, readonly).
 * Остается только AI-стратегия, которая должна обрабатывать все запросы //@gen.
 */
export class GeneratorFactory {
  private generators = new Map<StrategyId, BaseGenerator>([
    ['ai', new AIGenerator()],
  ]);

  getGenerator(strategyId: StrategyId): BaseGenerator | null {
    return this.generators.get(strategyId) || null;
  }

  hasGenerator(strategyId: StrategyId): boolean {
    return this.generators.has(strategyId);
  }
}

