/**
 * Менеджер закладок для BSL модулей
 * 
 * Управляет закладками в редакторе с визуализацией через декорации в gutter.
 * Закладки хранятся в памяти и отображаются как иконки в области номеров строк.
 */

import * as vscode from 'vscode';
import { outputChannel } from '../extension';

export class BookmarkManager {
	private static instance: BookmarkManager | null = null;
	
	// Хранение закладок: URI файла -> Set номеров строк
	private bookmarks: Map<vscode.Uri, Set<number>> = new Map();
	
	// Декорация для отображения иконки закладки
	private bookmarkDecoration: vscode.TextEditorDecorationType;
	
	// Подписки на события
	private subscriptions: vscode.Disposable[] = [];

	private constructor() {
		// Создаем декорацию для иконки закладки
		// Используем data URI с SVG иконкой закладки (желтый флажок)
		const bookmarkSvg = Buffer.from(
			'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
			'<path d="M4 2L8 2L10 4H12V14H4V2Z" fill="#FFD400" stroke="#FFD400" stroke-width="1"/>' +
			'</svg>'
		).toString('base64');
		
		this.bookmarkDecoration = vscode.window.createTextEditorDecorationType({
			gutterIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${bookmarkSvg}`),
			gutterIconSize: 'contain'
		});

		// Подписываемся на события изменения документов
		this.subscriptions.push(
			vscode.workspace.onDidCloseTextDocument((doc) => {
				// При закрытии документа удаляем закладки (опционально)
				// Можно оставить закладки в памяти для возможности восстановления
			})
		);

		// Обновляем декорации при изменении активного редактора
		this.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor((editor) => {
				if (editor) {
					this.updateDecorations(editor);
				}
			})
		);

		// Обновляем декорации при открытии документа
		this.subscriptions.push(
			vscode.workspace.onDidOpenTextDocument((document) => {
				const editor = vscode.window.visibleTextEditors.find(
					e => e.document.uri.toString() === document.uri.toString()
				);
				if (editor) {
					this.updateDecorations(editor);
				}
			})
		);
	}

	public static getInstance(): BookmarkManager {
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
	public toggleBookmark(lineNumber: number, document: vscode.TextDocument): void {
		const uri = document.uri;
		
		if (!this.bookmarks.has(uri)) {
			this.bookmarks.set(uri, new Set());
		}
		
		const fileBookmarks = this.bookmarks.get(uri)!;
		
		if (fileBookmarks.has(lineNumber)) {
			// Удаляем закладку
			fileBookmarks.delete(lineNumber);
			if (fileBookmarks.size === 0) {
				this.bookmarks.delete(uri);
			}
		} else {
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
	public getNextBookmark(document: vscode.TextDocument, currentLine: number): number | null {
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
	public clearAllBookmarks(document: vscode.TextDocument): void {
		const uri = document.uri;
		this.bookmarks.delete(uri);
		this.updateDecorationsForUri(uri);
	}

	/**
	 * Обновить декорации для всех редакторов с указанным URI
	 */
	private updateDecorationsForUri(uri: vscode.Uri): void {
		vscode.window.visibleTextEditors.forEach(editor => {
			if (editor.document.uri.toString() === uri.toString()) {
				this.updateDecorations(editor);
			}
		});
	}

	/**
	 * Обновить декорации для указанного редактора
	 */
	private updateDecorations(editor: vscode.TextEditor): void {
		const uri = editor.document.uri;
		const fileBookmarks = this.bookmarks.get(uri);
		
		if (!fileBookmarks || fileBookmarks.size === 0) {
			editor.setDecorations(this.bookmarkDecoration, []);
			return;
		}
		
		// Создаем массив Range для декораций
		const ranges: vscode.Range[] = [];
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
	public dispose(): void {
		this.bookmarkDecoration.dispose();
		this.subscriptions.forEach(sub => sub.dispose());
		this.subscriptions = [];
		this.bookmarks.clear();
	}
}

