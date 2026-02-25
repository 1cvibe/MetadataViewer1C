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
exports.scanMetadataRoot = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const UnicodeName_1 = require("./UnicodeName");
/**
 * Универсальное сканирование выгрузки конфигурации 1С (XML).
 *
 * Поддерживает оба формата:
 * 1) <TypeDir>/<ObjectName>/<ObjectName>.xml
 * 2) <TypeDir>/<ObjectName>.xml  (Languages, CommandGroups, CommonPictures и т.п.)
 *
 * + пытается обнаружить Ext/Predefined.xml рядом с объектом.
 */
async function scanMetadataRoot(root) {
    const result = { objects: [], errors: [] };
    try {
        await fs.promises.access(root);
    }
    catch {
        return { objects: [], errors: [`Root folder not found: ${root}`] };
    }
    // Технические папки выгрузки (не являются каталогами типов метаданных)
    const SKIP_DIRS = new Set(["Ext", ".git", ".idea", ".vscode", "node_modules"]);
    let typeDirs = [];
    try {
        typeDirs = (await fs.promises.readdir(root, { withFileTypes: true }))
            .filter((d) => d.isDirectory())
            .filter((d) => !SKIP_DIRS.has(d.name));
    }
    catch (e) {
        result.errors.push(`Error reading root directory: ${e instanceof Error ? e.message : String(e)}`);
        return result;
    }
    for (const typeDir of typeDirs) {
        const objectTypeDir = typeDir.name;
        try {
            await scanObjectType(root, objectTypeDir, result.objects);
        }
        catch (e) {
            result.errors.push(`Error scanning ${objectTypeDir}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return result;
}
exports.scanMetadataRoot = scanMetadataRoot;
async function scanObjectType(root, objectTypeDir, out) {
    const typeDirPath = path.join(root, objectTypeDir);
    const entries = await fs.promises.readdir(typeDirPath, { withFileTypes: true });
    // XML-файлы прямо в папке типа: Languages/*.xml, CommandGroups/*.xml, CommonPictures/*.xml и т.д.
    const rootXmlFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".xml"));
    for (const file of rootXmlFiles) {
        const fsName = (0, UnicodeName_1.basenameWithoutExt)(file.name);
        const mainXmlPath = path.join(typeDirPath, file.name);
        const ref = {
            objectTypeDir,
            fsName,
            displayName: (0, UnicodeName_1.decode1CUnicodeEscapes)(fsName),
            mainXmlPath
        };
        ref.extXmlPaths = await tryDetectExtXmls(typeDirPath, fsName, mainXmlPath);
        ref.predefinedXmlPath = ref.extXmlPaths?.find(p => path.basename(p).toLowerCase() === "predefined.xml");
        out.push(ref);
    }
    // Объекты в подпапках: Catalogs/<Name>/<Name>.xml и т.д.
    const subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    for (const sub of subdirs) {
        const subDirPath = path.join(typeDirPath, sub);
        try {
            const files = await fs.promises.readdir(subDirPath);
            // Основной файл, как правило, совпадает с именем папки
            const candidate = files.find((f) => f.toLowerCase() === `${sub.toLowerCase()}.xml`);
            if (!candidate)
                continue;
            const mainXmlPath = path.join(subDirPath, candidate);
            const ref = {
                objectTypeDir,
                fsName: sub,
                displayName: (0, UnicodeName_1.decode1CUnicodeEscapes)(sub),
                mainXmlPath
            };
            ref.extXmlPaths = await tryDetectExtXmls(typeDirPath, sub, mainXmlPath);
            ref.predefinedXmlPath = ref.extXmlPaths?.find(p => path.basename(p).toLowerCase() === "predefined.xml");
            out.push(ref);
        }
        catch {
            // игнорируем ошибки отдельных подпапок
        }
    }
}
async function tryDetectExtXmls(typeDirPath, fsName, mainXmlPath) {
    // Основной формат: <TypeDir>/<Name>/Ext/*.xml
    const objectDir = path.join(typeDirPath, fsName);
    const ext1 = path.join(objectDir, "Ext");
    const found1 = await listXmlFiles(ext1);
    if (found1.length)
        return found1;
    // Альтернатива: Ext лежит рядом с xml (когда объект без подпапки)
    const dir = path.dirname(mainXmlPath);
    const ext2 = path.join(dir, "Ext");
    const found2 = await listXmlFiles(ext2);
    if (found2.length)
        return found2;
    return undefined;
}
async function listXmlFiles(dir) {
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        return entries
            .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
            .map(e => path.join(dir, e.name));
    }
    catch {
        return [];
    }
}
async function fileExists(p) {
    try {
        await fs.promises.access(p, fs.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=MetadataScanner.js.map