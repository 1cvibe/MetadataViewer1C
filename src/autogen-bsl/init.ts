import * as vscode from 'vscode';

import { GenCommentDetector, GenCommentCodeActionProvider } from './ux/GenCommentCodeActionProvider';
import { IntentParser } from './intent/IntentParser';
import { IntentRouter } from './routing/IntentRouter';
import { GeneratorFactory } from './generators/GeneratorFactory';
import { outputChannel, statusBarProgress } from '../extension';
import { QueryStringEditor } from '../queryStringEditor';

export function initBslCursorFeatures(context: vscode.ExtensionContext) {
  // Code actions for // @gen in BSL
  const detector = new GenCommentDetector();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'bsl' },
      new GenCommentCodeActionProvider(detector),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  // Services
  const intentParser = new IntentParser();
  const router = new IntentRouter();
  const generatorFactory = new GeneratorFactory();

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('metadataViewer.genFromComment', async (doc: vscode.TextDocument, gen: any) => {
      try {
        const config = vscode.workspace.getConfiguration();
        const debugMode = config.get<boolean>('metadataViewer.debugMode', false);
        
        if (debugMode) {
          outputChannel.appendLine(`[genFromComment] Начало генерации, текст комментария: ${gen?.text || ''}`);
        }

        const intent = intentParser.parse(String(gen?.text || ''));
        const strategyId = router.route(intent);
        
        if (debugMode) {
          outputChannel.appendLine(`[genFromComment] Intent: ${intent.kind}, strategy: ${strategyId}, confidence: ${intent.confidence}`);
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== doc) {
          vscode.window.showWarningMessage('Активный редактор не соответствует документу');
          return;
        }

        const generator = generatorFactory.getGenerator(strategyId);
        if (!generator) {
          const message = `Генератор для стратегии "${strategyId}" не реализован.`;
          vscode.window.showWarningMessage(message);
          if (debugMode) {
            outputChannel.appendLine(`[genFromComment] ${message}`);
          }
          return;
        }

        // Определяем позицию для вставки кода (после комментария)
        const insertPosition = new vscode.Position(gen.range.end.line + 1, 0);
        
        const genContext = {
          document: doc,
          position: insertPosition,
          intent: intent
        };

        statusBarProgress.show();
        statusBarProgress.text = '$(sync~spin) Генерация кода…';
        try {
          const generatedCode = await Promise.resolve(generator.generate(genContext));
          
          if (debugMode) {
            outputChannel.appendLine(`[genFromComment] Сгенерированный код:\n${generatedCode}`);
          }

          const success = await generator.insertCode(genContext, generatedCode);
          
          if (success) {
            const message = `Код сгенерирован (${intent.kind} → ${strategyId})`;
            vscode.window.showInformationMessage(message);
            if (debugMode) {
              outputChannel.appendLine(`[genFromComment] ${message}`);
            }
          } else {
            const message = 'Не удалось вставить сгенерированный код';
            vscode.window.showErrorMessage(message);
            if (debugMode) {
              outputChannel.appendLine(`[genFromComment] Ошибка: ${message}`);
            }
          }
        } finally {
          statusBarProgress.hide();
        }
      } catch (error) {
        const errorMessage = `Ошибка при генерации кода: ${error instanceof Error ? error.message : String(error)}`;
        vscode.window.showErrorMessage(errorMessage);
        outputChannel.appendLine(`[genFromComment] ${errorMessage}`);
        console.error('[genFromComment]', error);
        statusBarProgress.hide();
      }
    })
  );


  // Обёртка для вызова генерации из комментария из контекстного меню
  context.subscriptions.push(
    vscode.commands.registerCommand('metadataViewer.genFromCommentPrompt', async () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) {
        vscode.window.showWarningMessage('Нет активного редактора');
        return;
      }

      const doc = ed.document;
      if (doc.languageId !== 'bsl') {
        vscode.window.showWarningMessage('Команда доступна только для BSL файлов');
        return;
      }

      const pos = ed.selection.active;
      const gen = detector.detect(doc, pos);
      
      if (!gen) {
        vscode.window.showWarningMessage('Не найден комментарий // @gen. Убедитесь, что курсор находится на строке с комментарием // @gen');
        return;
      }

      await vscode.commands.executeCommand('metadataViewer.genFromComment', doc, gen);
    })
  );

  // Команда для редактирования запроса из BSL-строки
  context.subscriptions.push(
    vscode.commands.registerCommand('metadataViewer.editQueryFromEditor', async () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) {
        vscode.window.showWarningMessage('Нет активного редактора');
        return;
      }

      const doc = ed.document;
      if (doc.languageId !== 'bsl') {
        vscode.window.showWarningMessage('Команда доступна только для BSL файлов');
        return;
      }

      const selection = ed.selection;
      let queryText = '';
      let range: vscode.Range;

      if (selection.isEmpty) {
        // Если нет выделения, автоматически ищем кавычки вокруг курсора (многострочный поиск)
        const cursorPos = selection.active;
        const cursorOffset = doc.offsetAt(cursorPos);
        const fullText = doc.getText();

        // Ищем открывающую кавычку перед курсором (по всему документу)
        let openQuoteOffset = -1;
        for (let i = cursorOffset - 1; i >= 0; i--) {
          if (fullText[i] === '"') {
            // В BSL экранирование: "" означает одну кавычку внутри строки
            // При движении назад: если перед текущей " стоит еще одна ", это часть экранированной последовательности
            if (i > 0 && fullText[i - 1] === '"') {
              // Это часть экранированной последовательности "", пропускаем обе кавычки
              i--; // Пропускаем обе кавычки (уже на i-1, цикл уменьшит i еще на 1)
              continue;
            }
            // Проверяем экранирование через обратный слэш
            if (i === 0 || fullText[i - 1] !== '\\') {
              openQuoteOffset = i;
              break;
            }
          }
        }

        // Ищем закрывающую кавычку после курсора (по всему документу)
        let closeQuoteOffset = -1;
        for (let i = cursorOffset; i < fullText.length; i++) {
          if (fullText[i] === '"') {
            // В BSL экранирование: "" означает одну кавычку внутри строки
            // При движении вперед: если после " стоит еще одна ", это часть экранированной последовательности
            if (i + 1 < fullText.length && fullText[i + 1] === '"') {
              // Это экранированная кавычка "", пропускаем обе кавычки
              i++; // Пропускаем обе кавычки (уже на i+1, цикл увеличит i еще на 1)
              continue;
            }
            // Проверяем экранирование через обратный слэш
            if (i === 0 || fullText[i - 1] !== '\\') {
              closeQuoteOffset = i;
              break;
            }
          }
        }

        if (openQuoteOffset === -1 || closeQuoteOffset === -1) {
          vscode.window.showWarningMessage('Курсор должен находиться внутри строки в двойных кавычках ""');
          return;
        }

        // Извлекаем текст между кавычками
        queryText = fullText.substring(openQuoteOffset + 1, closeQuoteOffset);
        
        // Убираем символы | в начале строк (кроме первой), включая случаи с пробелами перед |
        // Удаляем | в начале строки или после пробелов в начале строки
        queryText = queryText.replace(/^(\s*)\|/gm, '$1');
        
        // Создаем range для текста внутри кавычек (многострочный)
        range = new vscode.Range(
          doc.positionAt(openQuoteOffset + 1),
          doc.positionAt(closeQuoteOffset)
        );
      } else {
        // Если есть выделение, работаем с ним
        const selectedText = doc.getText(selection);
        queryText = selectedText;
        range = new vscode.Range(selection.start, selection.end);

        // Проверяем, выделена ли строка полностью с кавычками или только внутри
        const trimmed = selectedText.trim();
        
        // Если выделено с кавычками (начинается и заканчивается на ")
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          // Убираем внешние кавычки для редактора
          queryText = trimmed.slice(1, -1);
          // Убираем символы | в начале строк (кроме первой), включая случаи с пробелами перед |
          queryText = queryText.replace(/^(\s*)\|/gm, '$1');
          // Корректируем диапазон - внутренность кавычек
          const startOffset = doc.offsetAt(selection.start);
          const endOffset = doc.offsetAt(selection.end);
          const firstQuoteOffset = startOffset + selectedText.indexOf('"');
          const lastQuoteOffset = startOffset + selectedText.lastIndexOf('"');
          range = new vscode.Range(
            doc.positionAt(firstQuoteOffset + 1),
            doc.positionAt(lastQuoteOffset)
          );
        } else if (trimmed.includes('"')) {
          // Если есть кавычки внутри, но не с обеих сторон - ошибка
          vscode.window.showWarningMessage('Выделите строку полностью (с кавычками "" ) или только текст внутри кавычек');
          return;
        } else {
          // Если выделен текст внутри кавычек - убираем символы |, включая случаи с пробелами перед |
          queryText = queryText.replace(/^(\s*)\|/gm, '$1');
        }
      }

      // Открываем редактор
      const editor = new QueryStringEditor();
      await editor.openEditor(context.extensionUri, doc, range, queryText);
    })
  );

  // metadataViewer.scanMetadataWorkspace removed: the metadata tree is already built in 1c-metadata view.
}

