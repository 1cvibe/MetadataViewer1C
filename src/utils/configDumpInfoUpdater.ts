/**
 * Утилита для обновления ConfigDumpInfo.xml при изменении предопределенных элементов
 */

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { randomUUID, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * Обновляет ConfigDumpInfo.xml для предопределенных элементов
 * 
 * @param params - параметры обновления
 * @returns результат обновления
 */
export async function updateConfigDumpInfoForPredefined(params: {
    configDumpInfoPath: string;
    objectType: string;
    objectName: string;
    predefinedId?: string;
}): Promise<{ updated: boolean; id: string }> {
    const { configDumpInfoPath, objectType, objectName, predefinedId } = params;
    
    // Читаем ConfigDumpInfo.xml
    const configDumpInfoUri = vscode.Uri.file(configDumpInfoPath);
    const configXml = await vscode.workspace.fs.readFile(configDumpInfoUri);
    
    // Удаляем BOM если есть
    let cleanXml = Buffer.from(configXml).toString('utf8');
    if (cleanXml.charCodeAt(0) === 0xfeff) {
        cleanXml = cleanXml.slice(1);
    }
    
    // Парсим через xmldom
    const parser = new DOMParser({
        locator: {},
        errorHandler: {
            warning: (w: any) => console.warn('[xmldom] Warning:', w),
            error: (e: any) => console.error('[xmldom] Error:', e),
            fatalError: (e: any) => {
                console.error('[xmldom] Fatal error:', e);
                throw new Error(`XML parsing error: ${e}`);
            }
        }
    });
    
    const doc = parser.parseFromString(cleanXml, 'text/xml');
    
    // Проверяем ошибки парсинга
    const parserError = doc.getElementsByTagName('parsererror')[0];
    if (parserError) {
        const errorText = parserError.textContent || 'Unknown parsing error';
        throw new Error(`XML parsing error: ${errorText}`);
    }
    
    // Находим корневой элемент ConfigDumpInfo
    const rootElement = doc.documentElement;
    if (!rootElement || rootElement.nodeName !== 'ConfigDumpInfo') {
        throw new Error('Не найден корневой элемент ConfigDumpInfo');
    }
    
    // Находим ConfigVersions -> Metadata
    // Структура: <ConfigDumpInfo><ConfigVersions><Metadata>...</Metadata><Metadata>...</Metadata></ConfigVersions></ConfigDumpInfo>
    const configVersions = rootElement.getElementsByTagName('ConfigVersions')[0];
    if (!configVersions) {
        throw new Error('Не найден элемент ConfigVersions');
    }
    
    // Metadata - это массив элементов Metadata внутри ConfigVersions
    // Находим родительский элемент (ConfigVersions)
    const metadataParent = configVersions;
    
    // Формируем имя для поиска: Catalog.Номенклатура.Predefined
    const predefinedName = `${objectType}.${objectName}.Predefined`;
    
    // Ищем существующую запись среди всех элементов Metadata
    const allMetadata = Array.from(configVersions.getElementsByTagName('Metadata'));
    let foundMetadata: Element | null = null;
    
    for (const metadata of allMetadata) {
        const nameAttr = metadata.getAttribute('name');
        if (nameAttr === predefinedName) {
            foundMetadata = metadata;
            break;
        }
    }
    
    // Генерируем новый configVersion (32 hex символа)
    const configVersion = generateConfigVersion();
    
    if (foundMetadata) {
        // Обновляем существующую запись
        foundMetadata.setAttribute('configVersion', configVersion);
        const id = foundMetadata.getAttribute('id') || predefinedId || generatePredefinedId();
        if (!foundMetadata.getAttribute('id')) {
            foundMetadata.setAttribute('id', id);
        }
        
        // Сохраняем обновленный XML
        await saveConfigDumpInfo(configDumpInfoPath, doc);
        
        return { updated: true, id };
    } else {
        // Создаем новую запись
        const newId = predefinedId || generatePredefinedId();
        const newMetadata = doc.createElement('Metadata');
        newMetadata.setAttribute('name', predefinedName);
        newMetadata.setAttribute('id', newId);
        newMetadata.setAttribute('configVersion', configVersion);
        
        // Добавляем в конец массива Metadata (в ConfigVersions)
        metadataParent.appendChild(newMetadata);
        
        // Сохраняем обновленный XML
        await saveConfigDumpInfo(configDumpInfoPath, doc);
        
        return { updated: true, id: newId };
    }
}

/**
 * Генерирует UUID с суффиксом .1c для ID предопределенных элементов
 */
function generatePredefinedId(): string {
    return randomUUID() + '.1c';
}

/**
 * Генерирует configVersion (32 hex символа)
 */
function generateConfigVersion(): string {
    const bytes = randomBytes(16);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Сохраняет ConfigDumpInfo.xml с BOM
 */
async function saveConfigDumpInfo(path: string, doc: Document): Promise<void> {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);
    
    // Добавляем BOM
    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentBuffer = Buffer.from(xmlString, 'utf8');
    const finalBuffer = Buffer.concat([bomBuffer, contentBuffer]);
    
    // Сохраняем файл
    const uri = vscode.Uri.file(path);
    await vscode.workspace.fs.writeFile(uri, finalBuffer);
}

