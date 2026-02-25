"use strict";
/**
 * Утилиты для безопасной работы с файловой системой
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
exports.fileExists = exports.validatePath = exports.createBackup = exports.safeWriteFile = exports.safeReadFile = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const readFileAsync = (0, util_1.promisify)(fs.readFile);
const writeFileAsync = (0, util_1.promisify)(fs.writeFile);
const mkdirAsync = (0, util_1.promisify)(fs.mkdir);
/**
 * Безопасное чтение файла с обработкой ошибок
 */
async function safeReadFile(filePath, encoding = "utf8") {
    try {
        return await readFileAsync(filePath, encoding);
    }
    catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
}
exports.safeReadFile = safeReadFile;
/**
 * Безопасная запись файла с созданием директорий
 */
async function safeWriteFile(filePath, content, encoding = "utf8") {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            await mkdirAsync(dir, { recursive: true });
        }
        await writeFileAsync(filePath, content, encoding);
    }
    catch (error) {
        throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
}
exports.safeWriteFile = safeWriteFile;
/**
 * Создание резервной копии файла
 */
async function createBackup(filePath) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);
        const backupPath = path.join(dir, `${name}.backup.${timestamp}${ext}`);
        const content = await safeReadFile(filePath);
        await safeWriteFile(backupPath, content);
        return backupPath;
    }
    catch (error) {
        throw new Error(`Failed to create backup for ${filePath}: ${error.message}`);
    }
}
exports.createBackup = createBackup;
/**
 * Валидация пути для предотвращения path traversal
 */
function validatePath(basePath, targetPath) {
    const normalizedBase = path.resolve(basePath);
    const normalizedTarget = path.resolve(targetPath);
    return normalizedTarget.startsWith(normalizedBase);
}
exports.validatePath = validatePath;
/**
 * Проверка существования файла (async)
 */
async function fileExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
exports.fileExists = fileExists;
//# sourceMappingURL=fileUtils.js.map