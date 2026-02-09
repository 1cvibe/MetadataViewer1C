/**
 * Утилиты для безопасной работы с файловой системой
 */

import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Безопасное чтение файла с обработкой ошибок
 */
export async function safeReadFile(filePath: string, encoding: BufferEncoding = "utf8"): Promise<string> {
    try {
        return await readFileAsync(filePath, encoding);
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
}

/**
 * Безопасная запись файла с созданием директорий
 */
export async function safeWriteFile(filePath: string, content: string, encoding: BufferEncoding = "utf8"): Promise<void> {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            await mkdirAsync(dir, { recursive: true });
        }
        await writeFileAsync(filePath, content, encoding);
    } catch (error) {
        throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
}

/**
 * Создание резервной копии файла
 */
export async function createBackup(filePath: string): Promise<string> {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);
        
        const backupPath = path.join(dir, `${name}.backup.${timestamp}${ext}`);
        
        const content = await safeReadFile(filePath);
        await safeWriteFile(backupPath, content);
        
        return backupPath;
    } catch (error) {
        throw new Error(`Failed to create backup for ${filePath}: ${(error as Error).message}`);
    }
}

/**
 * Валидация пути для предотвращения path traversal
 */
export function validatePath(basePath: string, targetPath: string): boolean {
    const normalizedBase = path.resolve(basePath);
    const normalizedTarget = path.resolve(targetPath);
    
    return normalizedTarget.startsWith(normalizedBase);
}

/**
 * Проверка существования файла (async)
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

