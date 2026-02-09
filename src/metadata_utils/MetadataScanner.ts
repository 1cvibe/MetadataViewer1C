import * as fs from "fs";
import * as path from "path";
import { basenameWithoutExt, decode1CUnicodeEscapes } from "./UnicodeName";

export interface MetadataFileRef {
  /** Имя директории типа (Catalogs, Documents, Subsystems, ...) */
  objectTypeDir: string;
  /** Имя объекта как в файловой системе (может быть #U....) */
  fsName: string;
  /** Имя объекта для отображения (декодированное) */
  displayName: string;
  /** Путь к главному XML (обычно <Name>.xml) */
  mainXmlPath: string;
  /** Optional: путь к Ext/Predefined.xml если найден */
  predefinedXmlPath?: string;
  /** Optional: все XML-файлы из Ext (например Predefined.xml и прочие служебные XML) */
  extXmlPaths?: string[];
}

/**
 * Универсальное сканирование выгрузки конфигурации 1С (XML).
 *
 * Поддерживает оба формата:
 * 1) <TypeDir>/<ObjectName>/<ObjectName>.xml
 * 2) <TypeDir>/<ObjectName>.xml  (Languages, CommandGroups, CommonPictures и т.п.)
 *
 * + пытается обнаружить Ext/Predefined.xml рядом с объектом.
 */
export async function scanMetadataRoot(root: string): Promise<{ objects: MetadataFileRef[]; errors: string[] }> {
  const result = { objects: [] as MetadataFileRef[], errors: [] as string[] };

  try {
    await fs.promises.access(root);
  } catch {
    return { objects: [], errors: [`Root folder not found: ${root}`] };
  }

  // Технические папки выгрузки (не являются каталогами типов метаданных)
  const SKIP_DIRS = new Set(["Ext", ".git", ".idea", ".vscode", "node_modules"]);

  let typeDirs: fs.Dirent[] = [];
  try {
    typeDirs = (await fs.promises.readdir(root, { withFileTypes: true }))
      .filter((d: fs.Dirent) => d.isDirectory())
      .filter((d: fs.Dirent) => !SKIP_DIRS.has(d.name));
  } catch (e) {
    result.errors.push(`Error reading root directory: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  for (const typeDir of typeDirs) {
    const objectTypeDir = typeDir.name;
    try {
      await scanObjectType(root, objectTypeDir, result.objects);
    } catch (e) {
      result.errors.push(`Error scanning ${objectTypeDir}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}

async function scanObjectType(root: string, objectTypeDir: string, out: MetadataFileRef[]): Promise<void> {
  const typeDirPath = path.join(root, objectTypeDir);
  const entries = await fs.promises.readdir(typeDirPath, { withFileTypes: true });

  // XML-файлы прямо в папке типа: Languages/*.xml, CommandGroups/*.xml, CommonPictures/*.xml и т.д.
  const rootXmlFiles = entries.filter((e: fs.Dirent) => e.isFile() && e.name.toLowerCase().endsWith(".xml"));
  for (const file of rootXmlFiles) {
    const fsName = basenameWithoutExt(file.name);
    const mainXmlPath = path.join(typeDirPath, file.name);
    const ref: MetadataFileRef = {
      objectTypeDir,
      fsName,
      displayName: decode1CUnicodeEscapes(fsName),
      mainXmlPath
    };
    ref.extXmlPaths = await tryDetectExtXmls(typeDirPath, fsName, mainXmlPath);
    ref.predefinedXmlPath = ref.extXmlPaths?.find(p => path.basename(p).toLowerCase() === "predefined.xml");
    out.push(ref);
  }

  // Объекты в подпапках: Catalogs/<Name>/<Name>.xml и т.д.
  const subdirs = entries.filter((e: fs.Dirent) => e.isDirectory()).map((e: fs.Dirent) => e.name);
  for (const sub of subdirs) {
    const subDirPath = path.join(typeDirPath, sub);
    try {
      const files = await fs.promises.readdir(subDirPath);
      // Основной файл, как правило, совпадает с именем папки
      const candidate = files.find((f: string) => f.toLowerCase() === `${sub.toLowerCase()}.xml`);
      if (!candidate) continue;

      const mainXmlPath = path.join(subDirPath, candidate);
      const ref: MetadataFileRef = {
        objectTypeDir,
        fsName: sub,
        displayName: decode1CUnicodeEscapes(sub),
        mainXmlPath
      };
      ref.extXmlPaths = await tryDetectExtXmls(typeDirPath, sub, mainXmlPath);
      ref.predefinedXmlPath = ref.extXmlPaths?.find(p => path.basename(p).toLowerCase() === "predefined.xml");
      out.push(ref);
    } catch {
      // игнорируем ошибки отдельных подпапок
    }
  }
}

async function tryDetectExtXmls(typeDirPath: string, fsName: string, mainXmlPath: string): Promise<string[] | undefined> {
  // Основной формат: <TypeDir>/<Name>/Ext/*.xml
  const objectDir = path.join(typeDirPath, fsName);
  const ext1 = path.join(objectDir, "Ext");
  const found1 = await listXmlFiles(ext1);
  if (found1.length) return found1;

  // Альтернатива: Ext лежит рядом с xml (когда объект без подпапки)
  const dir = path.dirname(mainXmlPath);
  const ext2 = path.join(dir, "Ext");
  const found2 = await listXmlFiles(ext2);
  if (found2.length) return found2;

  return undefined;
}

async function listXmlFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith(".xml"))
      .map(e => path.join(dir, e.name));
  } catch {
    return [];
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
