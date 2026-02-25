"use strict";
/**
 * Менеджер закладок для BSL модулей
 *
 * Управляет закладками в редакторе с визуализацией через декорации в gutter.
 * Закладки хранятся в памяти и отображаются как иконки в области номеров строк.
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
exports.BookmarkManager = void 0;
const vscode = __importStar(require("vscode"));
class BookmarkManager {
    constructor() {
        // Хранение закладок: URI файла -> Set номеров строк
        this.bookmarks = new Map();
        // Подписки на события
        this.subscriptions = [];
        // Создаем декорацию для иконки закладки
        // Используем data URI с SVG иконкой закладки (желтый флажок)
        const bookmarkSvg = Buffer.from('<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M4 2L8 2L10 4H12V14H4V2Z" fill="#FFD400" stroke="#FFD400" stroke-width="1"/>' +
            '</svg>').toString('base64');
        this.bookmarkDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${bookmarkSvg}`),
            gutterIconSize: 'contain'
        });
        // Подписываемся на события изменения документов
        this.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => {
            // При закрытии документа удаляем закладки (опционально)
            // Можно оставить закладки в памяти для возможности восстановления
        }));
        // Обновляем декорации при изменении активного редактора
        this.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.updateDecorations(editor);
            }
        }));
        // Обновляем декорации при открытии документа
        this.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => {
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === document.uri.toString());
            if (editor) {
                this.updateDecorations(editor);
            }
        }));
    }
    static getInstance() {
        if (!BookmarkManager.instance) {
            BookmarkManager.instance = new BookmarkManager();
        }
        return BookmarkManager.instance;
    }
    /**
     * Переключить закладку на указанной строке
     * @param lineNumber Номер строки (0-based)
     * @param document Документ, в котором устанавливается закладка
     */
    toggleBookmark(lineNumber, document) {
        const uri = document.uri;
        if (!this.bookmarks.has(uri)) {
            this.bookmarks.set(uri, new Set());
        }
        const fileBookmarks = this.bookmarks.get(uri);
        if (fileBookmarks.has(lineNumber)) {
            // Удаляем закладку
            fileBookmarks.delete(lineNumber);
            if (fileBookmarks.size === 0) {
                this.bookmarks.delete(uri);
            }
        }
        else {
            // Добавляем закладку
            fileBookmarks.add(lineNumber);
        }
        // Обновляем декорации для всех открытых редакторов этого файла
        this.updateDecorationsForUri(uri);
    }
    /**
     * Получить следующую закладку после текущей позиции курсора
     * @param document Документ
     * @param currentLine Текущая строка (0-based)
     * @returns Номер строки следующей закладки или null, если закладок нет
     */
    getNextBookmark(document, currentLine) {
        const uri = document.uri;
        const fileBookmarks = this.bookmarks.get(uri);
        if (!fileBookmarks || fileBookmarks.size === 0) {
            return null;
        }
        // Ищем закладку после текущей строки
        const sortedBookmarks = Array.from(fileBookmarks).sort((a, b) => a - b);
        // Ищем первую закладку после текущей строки
        for (const bookmarkLine of sortedBookmarks) {
            if (bookmarkLine > currentLine) {
                return bookmarkLine;
            }
        }
        // Если не нашли после, возвращаем первую закладку (циклический переход)
        return sortedBookmarks.length > 0 ? sortedBookmarks[0] : null;
    }
    /**
     * Удалить все закладки в текущем документе
     * @param document Документ
     */
    clearAllBookmarks(document) {
        const uri = document.uri;
        this.bookmarks.delete(uri);
        this.updateDecorationsForUri(uri);
    }
    /**
     * Обновить декорации для всех редакторов с указанным URI
     */
    updateDecorationsForUri(uri) {
        vscode.window.visibleTextEditors.forEach(editor => {
            if (editor.document.uri.toString() === uri.toString()) {
                this.updateDecorations(editor);
            }
        });
    }
    /**
     * Обновить декорации для указанного редактора
     */
    updateDecorations(editor) {
        const uri = editor.document.uri;
        const fileBookmarks = this.bookmarks.get(uri);
        if (!fileBookmarks || fileBookmarks.size === 0) {
            editor.setDecorations(this.bookmarkDecoration, []);
            return;
        }
        // Создаем массив Range для декораций
        const ranges = [];
        for (const lineNumber of fileBookmarks) {
            if (lineNumber >= 0 && lineNumber < editor.document.lineCount) {
                const line = editor.document.lineAt(lineNumber);
                ranges.push(line.range);
            }
        }
        editor.setDecorations(this.bookmarkDecoration, ranges);
    }
    /**
     * Очистить все ресурсы
     */
    dispose() {
        this.bookmarkDecoration.dispose();
        this.subscriptions.forEach(sub => sub.dispose());
        this.subscriptions = [];
        this.bookmarks.clear();
    }
}
exports.BookmarkManager = BookmarkManager;
BookmarkManager.instance = null;
//# sourceMappingURL=bookmarkManager.js.map