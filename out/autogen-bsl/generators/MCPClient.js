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
exports.MCPClient = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const extension_1 = require("../../extension");
/**
 * MCP-клиент для работы с MCP серверами из расширения.
 *
 * ВАЖНО:
 * - В вашей сборке Cursor нет команд "Call/Invoke MCP Tool" для расширений.
 * - Используем прямое MCP-over-HTTP подключение по конфигу Cursor: `~/.cursor/mcp.json`.
 * - Для streamable-http серверов требуется:
 *   - заголовок `Accept: application/json`
 *   - заголовок `Mcp-Session-Id` (после initialize)
 */
class MCPClient {
    constructor() {
        this.rpcId = 1;
        this.serverCache = new Map();
        this.initialized = new Set();
    }
    /**
     * Задать вопрос 1С:Напарнику через MCP server 1c-ai.
     * Инструмент формируется из настроек расширения.
     */
    async ask1cAi(question, options) {
        const config = vscode.workspace.getConfiguration('metadataViewer');
        const serverName = config.get('mcpServer_Name', '1c-ai');
        const toolName = config.get('mcpServer_СodeGenerationToolName', 'ask_1c_ai');
        const fullToolName = `mcp_${serverName}_${toolName}`;
        return await this.callMCPTool(fullToolName, {
            question,
            programming_language: 'BSL',
            create_new_session: options?.create_new_session ?? false
        });
    }
    /**
     * Низкоуровневый вызов MCP tool.
     * Используем MCP-over-HTTP по `~/.cursor/mcp.json`.
     */
    async callMCPTool(toolName, params) {
        const serverName = this.resolveServerName(toolName);
        const server = await this.getServerRuntime(serverName);
        if (!this.initialized.has(serverName)) {
            try {
                await this.mcpInitialize(serverName, server);
            }
            catch (e) {
                // Некоторые серверы могут не требовать initialize — не блокируем,
                // но если дальше сервер потребует session id, tools/call упадет с понятной ошибкой.
                this.debug(`[MCPClient] initialize skip/failed for ${serverName}: ${this.errorToMessage(e)}`);
            }
            this.initialized.add(serverName);
        }
        return await this.mcpToolsCall(serverName, server, toolName, params);
    }
    /**
     * Сопоставляет toolName → имя сервера в mcp.json.
     */
    resolveServerName(toolName) {
        const config = vscode.workspace.getConfiguration('metadataViewer');
        const serverName = config.get('mcpServerName', '1c-ai');
        const prefix = `mcp_${serverName}_`;
        if (toolName.startsWith(prefix)) {
            return serverName;
        }
        throw new Error(`Неизвестный MCP tool (не удалось определить сервер): ${toolName}`);
    }
    async getServerRuntime(serverName) {
        const cached = this.serverCache.get(serverName);
        if (cached)
            return cached;
        const mcpJsonPath = this.getCursorMcpJsonPath();
        const raw = await fs.promises.readFile(mcpJsonPath, 'utf-8');
        const json = JSON.parse(raw);
        // Ожидаем структуру { mcpServers: { "1c-ai": { url, connection_id, type, ... } } }
        const servers = json?.mcpServers || json?.servers || json;
        const cfg = servers?.[serverName];
        if (!cfg?.url) {
            throw new Error(`В ${mcpJsonPath} не найден сервер "${serverName}" или отсутствует поле url`);
        }
        const out = {
            url: String(cfg.url),
            connectionId: cfg.connection_id ? String(cfg.connection_id) : undefined,
            type: cfg.type ? String(cfg.type) : undefined,
            sessionId: undefined
        };
        this.serverCache.set(serverName, out);
        return out;
    }
    getCursorMcpJsonPath() {
        return path.join(os.homedir(), '.cursor', 'mcp.json');
    }
    async mcpInitialize(serverName, server) {
        const initReq = {
            jsonrpc: '2.0',
            id: this.rpcId++,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'cursor-1c-metadata-viewer',
                    version: '0'
                }
            }
        };
        const initResp = await this.postJsonRpc(serverName, server, initReq, { expectResponse: true, allowMissingSession: true });
        // Streamable HTTP servers возвращают session id в заголовке.
        const sid = initResp.sessionId;
        if (sid) {
            server.sessionId = sid;
            this.debug(`[MCPClient] ${serverName} session: ${sid}`);
        }
        // Нотификация initialized (best-effort)
        const notif = {
            jsonrpc: '2.0',
            method: 'initialized',
            params: {}
        };
        await this.postJsonRpc(serverName, server, notif, { expectResponse: false, allowMissingSession: true });
    }
    /**
     * Приводит имя tool к реальному имени на MCP-сервере.
     *
     * В Cursor/инструментах иногда используются префиксы вида `mcp_<server>_...`.
     * Удаляет префикс на основе настроек расширения.
     */
    mapToolName(serverName, toolName) {
        const config = vscode.workspace.getConfiguration('metadataViewer');
        const configuredServerName = config.get('mcpServerName', '1c-ai');
        const prefix = `mcp_${configuredServerName}_`;
        if (serverName === configuredServerName && toolName.startsWith(prefix)) {
            return toolName.slice(prefix.length);
        }
        // По умолчанию — используем исходное имя.
        return toolName;
    }
    async mcpToolsCall(serverName, server, toolName, args) {
        const req = {
            jsonrpc: '2.0',
            id: this.rpcId++,
            method: 'tools/call',
            params: {
                name: this.mapToolName(serverName, toolName),
                arguments: args
            }
        };
        const resp = await this.postJsonRpc(serverName, server, req, { expectResponse: true, allowMissingSession: false });
        if (resp.json?.error) {
            throw new Error(`MCP error: ${this.safeToString(resp.json.error)}`);
        }
        return resp.json?.result ?? resp.json;
    }
    async postJsonRpc(serverName, server, payload, options) {
        const expectResponse = options?.expectResponse ?? true;
        const allowMissingSession = options?.allowMissingSession ?? false;
        const cfg = vscode.workspace.getConfiguration();
        const debugMode = cfg.get('metadataViewer.debugMode', false);
        if (debugMode) {
            extension_1.outputChannel.appendLine(`[MCPClient] HTTP → ${serverName}: ${payload?.method || 'request'}`);
        }
        const headers = {
            'content-type': 'application/json',
            accept: 'application/json'
        };
        // connection_id из Cursor mcp.json (best-effort, некоторые серверы могут игнорировать)
        if (server.connectionId) {
            headers['mcp-connection-id'] = server.connectionId;
            headers['x-mcp-connection-id'] = server.connectionId;
        }
        // Streamable HTTP серверы могут требовать Mcp-Session-Id на всех запросах после initialize.
        // Не делаем жёсткий pre-check, чтобы поддержать серверы без сессий.
        if (server.sessionId) {
            headers['mcp-session-id'] = server.sessionId;
        }
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), MCPClient.DEFAULT_TIMEOUT_MS);
        try {
            const res = await fetch(server.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            const sessionId = res.headers.get('mcp-session-id') || undefined;
            if (!expectResponse) {
                return { json: undefined, sessionId };
            }
            const text = await res.text();
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${text}`);
            }
            if (!text || text.trim().length === 0) {
                return { json: {}, sessionId };
            }
            try {
                return { json: JSON.parse(text), sessionId };
            }
            catch {
                return { json: { result: text }, sessionId };
            }
        }
        finally {
            clearTimeout(t);
        }
    }
    debug(message) {
        const cfg = vscode.workspace.getConfiguration();
        const debugMode = cfg.get('metadataViewer.debugMode', false);
        if (!debugMode)
            return;
        extension_1.outputChannel.appendLine(message);
    }
    errorToMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    safeToString(value) {
        if (value === null || value === undefined)
            return '';
        if (typeof value === 'string')
            return value;
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
}
exports.MCPClient = MCPClient;
MCPClient.DEFAULT_TIMEOUT_MS = 25000;
//# sourceMappingURL=MCPClient.js.map