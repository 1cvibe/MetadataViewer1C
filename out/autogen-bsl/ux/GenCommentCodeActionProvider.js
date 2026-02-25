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
exports.GenCommentCodeActionProvider = exports.GenCommentDetector = void 0;
const vscode = __importStar(require("vscode"));
class GenCommentDetector {
    detect(doc, pos) {
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
    isGenLine(line) {
        // Поддерживаем варианты: "// @gen ...", "//@gen ...", "//\t@gen ..."
        return /^\/\/\s*@gen\b/i.test(line);
    }
    collect(doc, startLine) {
        const lines = [];
        let end = startLine;
        for (let i = startLine; i < doc.lineCount; i++) {
            const t = doc.lineAt(i).text.trim();
            if (!t.startsWith("//"))
                break;
            lines.push(t.replace(/^\/\/\s?/, ""));
            end = i;
        }
        return {
            range: new vscode.Range(startLine, 0, end, doc.lineAt(end).text.length),
            text: lines.join("\n")
        };
    }
}
exports.GenCommentDetector = GenCommentDetector;
class GenCommentCodeActionProvider {
    constructor(detector) {
        this.detector = detector;
    }
    provideCodeActions(doc, range) {
        const pos = range.start;
        const gen = this.detector.detect(doc, pos);
        if (!gen)
            return [];
        const action = new vscode.CodeAction("Generate code from comment", vscode.CodeActionKind.QuickFix);
        action.command = {
            command: "metadataViewer.genFromComment",
            title: "Generate from comment",
            arguments: [doc, gen]
        };
        return [action];
    }
}
exports.GenCommentCodeActionProvider = GenCommentCodeActionProvider;
//# sourceMappingURL=GenCommentCodeActionProvider.js.map