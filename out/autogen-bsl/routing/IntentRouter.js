"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRouter = void 0;
class IntentRouter {
    // Всегда маршрутизируем в AI-генератор, независимо от intent.kind
    route(_intent) {
        return "ai";
    }
}
exports.IntentRouter = IntentRouter;
//# sourceMappingURL=IntentRouter.js.map