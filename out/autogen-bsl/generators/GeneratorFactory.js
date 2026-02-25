"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorFactory = void 0;
const AIGenerator_1 = require("./AIGenerator");
/**
 * Фабрика генераторов кода.
 * По требованию заказчика отключены преднастроенные стратегии (validation, bind, command, readonly).
 * Остается только AI-стратегия, которая должна обрабатывать все запросы //@gen.
 */
class GeneratorFactory {
    constructor() {
        this.generators = new Map([
            ['ai', new AIGenerator_1.AIGenerator()],
        ]);
    }
    getGenerator(strategyId) {
        return this.generators.get(strategyId) || null;
    }
    hasGenerator(strategyId) {
        return this.generators.has(strategyId);
    }
}
exports.GeneratorFactory = GeneratorFactory;
//# sourceMappingURL=GeneratorFactory.js.map