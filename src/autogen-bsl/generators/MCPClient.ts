import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { outputChannel } from '../../extension';

interface McpServerRuntime {
  url: string;
  connectionId?: string;
  type?: string;
  sessionId?: string;
}

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
export class MCPClient {
  private static readonly DEFAULT_TIMEOUT_MS = 25_000;

  private rpcId = 1;

  private serverCache = new Map<string, McpServerRuntime>();
  private initialized = new Set<string>();


  /**
   * Задать вопрос 1С:Напарнику через MCP server 1c-ai.
   * Инструмент формируется из настроек расширения.
   */
  async ask1cAi(question: string, options?: { create_new_session?: boolean }): Promise<any> {
    const config = vscode.workspace.getConfiguration('metadataViewer');
    const serverName = config.get<string>('mcpServer_Name', '1c-ai');
    const toolName = config.get<string>('mcpServer_СodeGenerationToolName', 'ask_1c_ai');
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
  private async callMCPTool(toolName: string, params: any): Promise<any> {
    const serverName = this.resolveServerName(toolName);
    const server = await this.getServerRuntime(serverName);

    if (!this.initialized.has(serverName)) {
      try {
        await this.mcpInitialize(serverName, server);
      } catch (e) {
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
  private resolveServerName(toolName: string): string {
    const config = vscode.workspace.getConfiguration('metadataViewer');
    const serverName = config.get<string>('mcpServerName', '1c-ai');
    const prefix = `mcp_${serverName}_`;
    
    if (toolName.startsWith(prefix)) {
      return serverName;
    }

    throw new Error(`Неизвестный MCP tool (не удалось определить сервер): ${toolName}`);
  }

  private async getServerRuntime(serverName: string): Promise<McpServerRuntime> {
    const cached = this.serverCache.get(serverName);
    if (cached) return cached;

    const mcpJsonPath = this.getCursorMcpJsonPath();
    const raw = await fs.promises.readFile(mcpJsonPath, 'utf-8');
    const json = JSON.parse(raw);

    // Ожидаем структуру { mcpServers: { "1c-ai": { url, connection_id, type, ... } } }
    const servers = json?.mcpServers || json?.servers || json;
    const cfg = servers?.[serverName];

    if (!cfg?.url) {
      throw new Error(`В ${mcpJsonPath} не найден сервер "${serverName}" или отсутствует поле url`);
    }

    const out: McpServerRuntime = {
      url: String(cfg.url),
      connectionId: cfg.connection_id ? String(cfg.connection_id) : undefined,
      type: cfg.type ? String(cfg.type) : undefined,
      sessionId: undefined
    };

    this.serverCache.set(serverName, out);
    return out;
  }

  private getCursorMcpJsonPath(): string {
    return path.join(os.homedir(), '.cursor', 'mcp.json');
  }

  private async mcpInitialize(serverName: string, server: McpServerRuntime): Promise<void> {
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
  private mapToolName(serverName: string, toolName: string): string {
    const config = vscode.workspace.getConfiguration('metadataViewer');
    const configuredServerName = config.get<string>('mcpServerName', '1c-ai');
    const prefix = `mcp_${configuredServerName}_`;
    
    if (serverName === configuredServerName && toolName.startsWith(prefix)) {
      return toolName.slice(prefix.length);
    }

    // По умолчанию — используем исходное имя.
    return toolName;
  }

  private async mcpToolsCall(serverName: string, server: McpServerRuntime, toolName: string, args: any): Promise<any> {
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

  private async postJsonRpc(
    serverName: string,
    server: McpServerRuntime,
    payload: any,
    options?: { expectResponse?: boolean; allowMissingSession?: boolean }
  ): Promise<{ json: any; sessionId?: string }> {
    const expectResponse = options?.expectResponse ?? true;
    const allowMissingSession = options?.allowMissingSession ?? false;

    const cfg = vscode.workspace.getConfiguration();
    const debugMode = cfg.get<boolean>('metadataViewer.debugMode', false);
    if (debugMode) {
      outputChannel.appendLine(`[MCPClient] HTTP → ${serverName}: ${payload?.method || 'request'}`);
    }

    const headers: Record<string, string> = {
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
      } catch {
        return { json: { result: text }, sessionId };
      }
    } finally {
      clearTimeout(t);
    }
  }

  private debug(message: string): void {
    const cfg = vscode.workspace.getConfiguration();
    const debugMode = cfg.get<boolean>('metadataViewer.debugMode', false);
    if (!debugMode) return;
    outputChannel.appendLine(message);
  }

  private errorToMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private safeToString(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
