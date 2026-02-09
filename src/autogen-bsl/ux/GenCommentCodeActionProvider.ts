import * as vscode from "vscode";

export interface GenComment {
  range: vscode.Range;
  text: string;
}

export class GenCommentDetector {
  detect(doc: vscode.TextDocument, pos: vscode.Position): GenComment | null {
    const line = doc.lineAt(pos.line).text.trim();

    if (this.isGenLine(line)) {
      return this.collect(doc, pos.line);
    }

    if (pos.line > 0) {
      const prev = doc.lineAt(pos.line - 1).text.trim();
      if (this.isGenLine(prev)) {
        return this.collect(doc, pos.line - 1);
      }
    }

    return null;
  }

  private isGenLine(line: string): boolean {
    // Поддерживаем варианты: "// @gen ...", "//@gen ...", "//\t@gen ..."
    return /^\/\/\s*@gen\b/i.test(line);
  }

  private collect(doc: vscode.TextDocument, startLine: number): GenComment {
    const lines: string[] = [];
    let end = startLine;

    for (let i = startLine; i < doc.lineCount; i++) {
      const t = doc.lineAt(i).text.trim();
      if (!t.startsWith("//")) break;
      lines.push(t.replace(/^\/\/\s?/, ""));
      end = i;
    }

    return {
      range: new vscode.Range(startLine, 0, end, doc.lineAt(end).text.length),
      text: lines.join("\n")
    };
  }
}

export class GenCommentCodeActionProvider implements vscode.CodeActionProvider {
  constructor(private detector: GenCommentDetector) {}

  provideCodeActions(doc: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] {
    const pos = range.start;
    const gen = this.detector.detect(doc, pos);
    if (!gen) return [];

    const action = new vscode.CodeAction("Generate code from comment", vscode.CodeActionKind.QuickFix);
    action.command = {
      command: "metadataViewer.genFromComment",
      title: "Generate from comment",
      arguments: [doc, gen]
    };
    return [action];
  }
}

