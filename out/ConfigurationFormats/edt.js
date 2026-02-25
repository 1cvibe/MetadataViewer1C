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
exports.Edt = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const utils_1 = require("./utils");
const path_1 = require("path");
const vscode_1 = require("vscode");
/** Нормализует префикс типа в PascalCase для сопоставления с filterSet (commonModule → CommonModule). */
function normalizeMetadataNameForFilter(name) {
    const t = (name ?? '').trim();
    const dotIdx = t.indexOf('.');
    if (dotIdx <= 0)
        return t;
    const typePart = t.slice(0, dotIdx);
    const rest = t.slice(dotIdx);
    return typePart.charAt(0).toUpperCase() + typePart.slice(1) + rest;
}
class Edt {
    constructor(xmlPath, dataProvider) {
        this.xmlPath = xmlPath;
        this.dataProvider = dataProvider;
    }
    createTreeElements(root, subsystemFilter) {
        vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Происходит загрузка конфигурации",
            cancellable: true
        }, async (progress, _) => {
            // Content может использовать camelCase (commonModule), добавляем оба варианта для сопоставления
            const filterSet = new Set(subsystemFilter.flatMap(s => {
                const t = (s ?? '').trim();
                if (!t)
                    return [];
                return [t, normalizeMetadataNameForFilter(t)];
            }).filter(Boolean));
            const arrayPaths = (0, utils_1.getConfigPaths)();
            const configXml = fs.readFileSync(this.xmlPath.fsPath, 'utf8');
            const parser = new fast_xml_parser_1.XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '$_',
                isArray: (name, jpath, isLeafNode, isAttribute) => {
                    if (arrayPaths.indexOf(jpath) !== -1)
                        return true;
                    return false;
                }
            });
            const configuration = parser.parse(Buffer.from(configXml))['mdclass:Configuration'];
            let total = 0;
            arrayPaths.forEach(path => {
                const objectsName = path.split('.')[1];
                const objs = configuration[objectsName] ?? configuration[objectsName.charAt(0).toUpperCase() + objectsName.slice(1)];
                total += objs?.length ?? 0;
            });
            console.time('edtDownload');
            if (configuration) {
                let count = 0;
                for (const [index, path] of arrayPaths.entries()) {
                    const objectsName = path.split('.')[1];
                    // EDT может использовать PascalCase (CommonModules) или camelCase (commonModules)
                    const objects = configuration[objectsName] ?? configuration[objectsName.charAt(0).toUpperCase() + objectsName.slice(1)];
                    if (objects && objects.length) {
                        const treeItem = this.searchTree(root, root.id + '/' + objectsName);
                        const subTree = [...treeItem?.children ?? []];
                        for (const [indexOfObjects, obj] of objects.entries()) {
                            // Нормализация obj для сравнения с subsystemFilter (формат "CommonModule.Имя", "Role.Имя")
                            // EDT парсер использует attributeNamePrefix: '$_', поэтому ref -> $_ref
                            const objNameForFilter = typeof obj === 'string'
                                ? obj
                                : (obj && typeof obj === 'object'
                                    ? obj.ref ?? obj.$_ref ?? obj.name ?? obj['#text'] ?? obj.value ?? obj.text ??
                                        (Object.keys(obj).length === 1 && typeof (Object.values(obj)[0]) === 'string' ? Object.values(obj)[0] : null)
                                    : null);
                            // EDT может возвращать name без префикса типа — добавляем для сравнения
                            const typePrefixMap = {
                                commonModules: 'CommonModule', documents: 'Document', roles: 'Role',
                                sessionParameters: 'SessionParameter', commonAttributes: 'CommonAttribute',
                                exchangePlans: 'ExchangePlan', filterCriteria: 'FilterCriterion',
                                eventSubscriptions: 'EventSubscription', scheduledJobs: 'ScheduledJob',
                                functionalOptions: 'FunctionalOption', functionalOptionsParameters: 'FunctionalOptionsParameter',
                                definedTypes: 'DefinedType', settingsStorages: 'SettingsStorage',
                                commonCommands: 'CommonCommand', commandGroups: 'CommandGroup',
                                commonForms: 'CommonForm', commonTemplates: 'CommonTemplate',
                                constants: 'Constant', catalogs: 'Catalog', enums: 'Enum',
                                reports: 'Report', dataProcessors: 'DataProcessor', tasks: 'Task',
                                informationRegisters: 'InformationRegister', accomulationRegisters: 'AccumulationRegister',
                                accountingRegisters: 'AccountingRegister', calculationRegisters: 'CalculationRegister',
                                businessProcesses: 'BusinessProcess', externalDataSources: 'ExternalDataSource'
                            };
                            const normalizedForFilter = (objNameForFilter && !objNameForFilter.includes('.'))
                                ? (typePrefixMap[objectsName] ? typePrefixMap[objectsName] + '.' + objNameForFilter : objNameForFilter)
                                : objNameForFilter;
                            if (filterSet.size > 0 && objNameForFilter !== null &&
                                !filterSet.has(objNameForFilter.trim()) &&
                                !filterSet.has((normalizedForFilter ?? '').trim())) {
                                continue;
                            }
                            count++;
                            if (count % Math.round(total / 100) === 0) {
                                progress.report({ increment: 1 });
                            }
                            progress.report({
                                message: `
									загрузка ${indexOfObjects + 1} из ${objects.length} объектов
									${treeItem?.label?.toString().toLowerCase()}`
                            });
                            const objNameForCreate = typeof obj === 'string' ? obj : (normalizedForFilter ?? objNameForFilter);
                            const subtreeItem = objNameForCreate ? await this.createElement(root.id, objNameForCreate) : null;
                            if (subtreeItem) {
                                subTree.push(subtreeItem);
                            }
                        }
                        treeItem.children = subTree;
                    }
                    this.dataProvider.update();
                }
            }
            console.timeEnd('edtDownload');
            if (subsystemFilter.length) {
                // Нумераторы и последовательности в документах
                if (root.children[3].children[1].children?.length === 0) {
                    root.children[3].children?.splice(1, 1);
                }
                if (root.children[3].children[0].children?.length === 0) {
                    root.children[3].children?.splice(0, 1);
                }
                // Очищаю пустые элементы
                const indexesToDelete = [];
                root.children?.forEach((ch, index) => {
                    if (!ch.children || ch.children.length === 0) {
                        indexesToDelete.push(index);
                    }
                });
                indexesToDelete.sort((a, b) => b - a);
                indexesToDelete.forEach((d) => root.children?.splice(d, 1));
                // Отдельно очищаю раздел "Общие"
                indexesToDelete.splice(0);
                root.children[0].children?.forEach((ch, index) => {
                    if (!ch.children || ch.children.length === 0) {
                        indexesToDelete.push(index);
                    }
                });
                indexesToDelete.sort((a, b) => b - a);
                indexesToDelete.forEach((d) => root.children[0].children?.splice(d, 1));
                // Ненужные вложенные подсистемы
                this.removeSubSystems(root.children[0].children[0], subsystemFilter);
                this.dataProvider.update();
            }
        }); // WithProgress
    }
    removeSubSystems(subsystemsTreeItem, subsystemFilter) {
        const indexesToDelete = [];
        subsystemsTreeItem.children?.forEach((ch, index) => {
            if (subsystemFilter.indexOf(`Subsystem.${ch.label}`) === -1) {
                indexesToDelete.push(index);
            }
            else {
                this.removeSubSystems(ch, subsystemFilter);
            }
        });
        indexesToDelete.sort((a, b) => b - a);
        indexesToDelete.forEach((d) => subsystemsTreeItem.children?.splice(d, 1));
    }
    async createElement(rootPath, objName) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }
        const folderUri = workspaceFolders[0].uri;
        const objectPath = (0, utils_1.CreatePath)(objName);
        const treeItemIdSlash = rootPath + '/';
        const xmlPath = folderUri.with({ path: path_1.posix.join(rootPath, objectPath, objName.split('.')[1] + '.mdo') });
        return fs.promises.readFile(xmlPath.fsPath)
            .then(async (configXml) => {
            const arrayPaths = (0, utils_1.getObjectPaths)();
            const parser = new fast_xml_parser_1.XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '$_',
                isArray: (name, jpath, isLeafNode, isAttribute) => {
                    if (arrayPaths.indexOf(jpath) !== -1)
                        return true;
                    return false;
                }
            });
            const element = parser.parse(Buffer.from(configXml));
            const elementObject = element[Object.keys(element)[1]];
            const elementName = elementObject.name;
            const treeItemId = treeItemIdSlash + elementObject.$_uuid;
            const treeItemPath = `${treeItemIdSlash}${(0, utils_1.CreatePath)(objectPath)}`;
            switch (objName.split('.')[0]) {
                case 'Subsystem': {
                    const { chilldren, content } = await this.getSubsystemChildren(elementObject, folderUri, path_1.posix.join(rootPath, objectPath));
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'subsystem',
                        context: `subsystem_${rootPath}`,
                        children: chilldren,
                        command: 'metadataViewer.filterBySubsystem',
                        commandTitle: 'Filter by subsystem',
                        commandArguments: content,
                        configType: 'edt'
                    });
                }
                case 'CommonModule':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'commonModule', context: 'module', path: treeItemPath,
                        configType: 'edt'
                    });
                case 'SessionParameter':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'sessionParameter', configType: 'edt'
                    });
                case 'Role':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'role', configType: 'edt'
                    });
                case 'CommonAttribute':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'attribute', configType: 'edt'
                    });
                case 'ExchangePlan':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'exchangePlan', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'ExchangePlans', elementObject),
                        configType: 'edt'
                    });
                case 'EventSubscription':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'eventSubscription', context: 'handler', path: treeItemPath,
                        configType: 'edt'
                    });
                case 'ScheduledJob':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'scheduledJob', context: 'handler', path: treeItemPath,
                        configType: 'edt'
                    });
                case 'CommonForm':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'form', context: 'form', path: treeItemPath,
                        configType: 'edt'
                    });
                case 'CommonPicture':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'picture', configType: 'edt'
                    });
                case 'WebService':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'ws', context: 'module', path: treeItemPath,
                        children: this.fillWebServiceItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'HTTPService':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'http', context: 'module', path: treeItemPath,
                        children: this.fillHttpServiceItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'WSReference':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'wsLink', configType: 'edt'
                    });
                case 'Style':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'style', configType: 'edt'
                    });
                case 'Constant':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'constant', context: 'valueManager_and_manager', path: treeItemPath,
                        configType: 'edt'
                    });
                case 'Catalog':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'catalog', context: 'object_and_manager_and_predefined', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'Catalogs', elementObject),
                        configType: 'edt'
                    });
                case 'Document':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'document', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'Documents', elementObject),
                        configType: 'edt'
                    });
                case 'DocumentNumerator':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, { icon: 'documentNumerator', configType: 'edt' });
                case 'Sequence':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, { icon: 'sequence', configType: 'edt' });
                case 'DocumentJournal':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'documentJournal', context: 'manager', path: treeItemPath,
                        children: this.fillDocumentJournalItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'Enum':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'enum', context: 'manager', path: treeItemPath,
                        children: this.fillEnumItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'Report':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'report', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'Reports', elementObject),
                        configType: 'edt'
                    });
                case 'DataProcessor':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'dataProcessor', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'DataProcessors', elementObject),
                        configType: 'edt'
                    });
                case 'ChartOfCharacteristicTypes':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'chartsOfCharacteristicType', context: 'object_and_manager_and_predefined', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'ChartsOfCharacteristicTypes', elementObject),
                        configType: 'edt'
                    });
                case 'ChartOfAccounts':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'chartsOfAccount', context: 'object_and_manager_and_predefined', path: treeItemPath,
                        children: this.fillChartOfAccountsItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'ChartOfCalculationTypes':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'chartsOfCalculationType', context: 'object_and_manager_and_predefined', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'ChartsOfCalculationTypes', elementObject),
                        configType: 'edt'
                    });
                case 'InformationRegister':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'informationRegister', context: 'recordset_and_manager', path: treeItemPath,
                        children: this.fillRegisterItemsByMetadata(treeItemIdSlash, 'InformationRegisters', elementObject),
                        configType: 'edt'
                    });
                case 'AccumulationRegister':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'accumulationRegister', context: 'recordset_and_manager', path: treeItemPath,
                        children: this.fillRegisterItemsByMetadata(treeItemIdSlash, 'AccumulationRegisters', elementObject),
                        configType: 'edt'
                    });
                case 'AccountingRegister':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'accountingRegister', context: 'recordset_and_manager', path: treeItemPath,
                        children: this.fillRegisterItemsByMetadata(treeItemIdSlash, 'AccountingRegisters', elementObject),
                        configType: 'edt'
                    });
                case 'CalculationRegister':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'calculationRegister', context: 'recordset_and_manager', path: treeItemPath,
                        children: this.fillCalculationRegisterItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'BusinessProcess':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'businessProcess', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillObjectItemsByMetadata(treeItemIdSlash, 'BusinessProcesses', elementObject),
                        configType: 'edt'
                    });
                case 'Task':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'task', context: 'object_and_manager', path: treeItemPath,
                        children: this.fillTaskItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
                case 'ExternalDataSource':
                    return (0, utils_1.GetTreeItem)(treeItemId, elementName ?? objName, {
                        icon: 'externalDataSource',
                        children: this.fillExternalDataSourceItemsByMetadata(treeItemIdSlash, elementObject),
                        configType: 'edt'
                    });
            }
        });
    }
    searchTree(element, matchingId) {
        if (element.id === matchingId) {
            return element;
        }
        else if (element.children != null && element.children.length > 0) {
            let result = null;
            for (let i = 0; result == null && i < element.children.length; i++) {
                result = this.searchTree(element.children[i], matchingId);
            }
            return result;
        }
        return null;
    }
    /**
     * Рекурсивно собирает дочерние подсистемы и Content (включая вложенные).
     * Content вложенных подсистем объединяется с Content родителя для корректной фильтрации.
     */
    async getSubsystemChildren(obj, folderUri, path) {
        const subtreeItems = [];
        // добавляю к фильтру сами подсистемы с иерархией
        const subsystemContent = [];
        if (path && typeof path === 'string') {
            const subsystemIndex = path.indexOf('Subsystem');
            if (subsystemIndex !== -1) {
                const subsystemPath = path.slice(subsystemIndex).replace(/Subsystems\//g, 'Subsystem.');
                if (subsystemPath) {
                    subsystemContent.push(...subsystemPath.split('/').filter(Boolean));
                }
            }
        }
        const rootPath = path && typeof path === 'string' && path.indexOf('Subsystem') !== -1
            ? path.slice(0, path.indexOf('Subsystem') - 1)
            : '';
        const contentArr = obj.content ? (Array.isArray(obj.content) ? obj.content : [obj.content]) : [];
        if (contentArr.length > 0) {
            for (const content of contentArr) {
                // EDT .mdo может возвращать объекты { ref: "CommonModule.Имя" } или строки; attributeNamePrefix -> $_ref
                const ref = typeof content === 'string' ? content : (content?.ref ?? content?.$_ref ?? content?.['#text'] ?? content?.name ?? (typeof content === 'object' && content ? String(content) : null));
                if (ref && typeof ref === 'string' && ref.trim().length > 0) {
                    subsystemContent.push(ref.trim());
                }
            }
        }
        const subsystemsArr = obj.subsystems ? (Array.isArray(obj.subsystems) ? obj.subsystems : [obj.subsystems]) : [];
        for (const subsystem of subsystemsArr) {
            let subsystemName = typeof subsystem === 'string' ? subsystem : (subsystem?.ref ?? subsystem?.$_ref ?? subsystem?.name ?? subsystem?.['#text'] ?? String(subsystem ?? ''));
            if (subsystemName && subsystemName.includes('.')) {
                subsystemName = subsystemName.split('.').pop() ?? subsystemName;
            }
            if (!subsystemName || !String(subsystemName).trim())
                continue;
            const subPath = path_1.posix.join(path, 'Subsystems', subsystemName);
            const fileName = folderUri.with({ path: path_1.posix.join(subPath, `${subsystemName}.mdo`) });
            try {
                const data = await fs.promises.readFile(fileName.fsPath);
                const parser = new fast_xml_parser_1.XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: '$_',
                    isArray: (name, jpath, isLeafNode, isAttribute) => {
                        if (jpath === 'mdclass:Subsystem.subsystems')
                            return true;
                        return false;
                    }
                });
                const element = parser.parse(data);
                const elementObject = element[Object.keys(element)[1]];
                const elementName = elementObject?.name;
                const { chilldren, content } = await this.getSubsystemChildren(elementObject, folderUri, subPath);
                // Объединяем Content вложенной подсистемы с родителем
                for (const item of content) {
                    if (item && !subsystemContent.includes(item)) {
                        subsystemContent.push(item);
                    }
                }
                subtreeItems.push((0, utils_1.GetTreeItem)(`${rootPath}/${elementObject.$_uuid}`, elementName ?? subsystemName, {
                    icon: 'subsystem',
                    context: `subsystem_${rootPath}`,
                    children: chilldren,
                    command: 'metadataViewer.filterBySubsystem',
                    commandTitle: 'Filter by subsystem',
                    commandArguments: content,
                    configType: 'edt'
                }));
            }
            catch {
                // Файл не найден или ошибка чтения — пропускаем вложенную подсистему
            }
        }
        return { chilldren: subtreeItems, content: subsystemContent };
    }
    fillObjectItemsByMetadata(idPrefix, metadataType, metadata) {
        const attributes = metadata.attributes?.
            map((attr) => (0, utils_1.GetTreeItem)(idPrefix + attr.$_uuid, attr.name, { icon: 'attribute' }));
        const tabularSection = metadata.tabularSections?.
            map((tabularSection) => (0, utils_1.GetTreeItem)(idPrefix + tabularSection.$_uuid, tabularSection.name, { icon: 'tabularSection',
            children: tabularSection.attributes?.
                map((tsAttr) => (0, utils_1.GetTreeItem)(idPrefix + tsAttr.$_uuid, tsAttr.name, { icon: 'attribute' })) }));
        const items = [
            (0, utils_1.GetTreeItem)('', 'Реквизиты', { icon: 'attribute', children: attributes?.length === 0 ? undefined : attributes }),
            (0, utils_1.GetTreeItem)('', 'Табличные части', { icon: 'tabularSection', children: tabularSection }),
        ];
        return [...items, ...this.fillCommonItems(idPrefix, metadataType, metadata)];
    }
    fillWebServiceItemsByMetadata(idPrefix, metadata) {
        return metadata.operations?.map((operation) => (0, utils_1.GetTreeItem)(idPrefix + operation.$_uuid, operation.name, {
            icon: 'operation', children: operation.parameters?.
                map(parameter => (0, utils_1.GetTreeItem)(idPrefix + parameter.$_uuid, parameter.name, { icon: 'parameter' }))
        }));
    }
    fillHttpServiceItemsByMetadata(idPrefix, metadata) {
        return metadata.urlTemplates?.map((urlTemplate) => (0, utils_1.GetTreeItem)(idPrefix + urlTemplate.$_uuid, urlTemplate.name, {
            icon: 'urlTemplate', children: urlTemplate.methods?.
                map(method => (0, utils_1.GetTreeItem)(idPrefix + method.$_uuid, method.name, { icon: 'parameter' }))
        }));
    }
    fillCommonItems(idPrefix, metadataType, metadata) {
        return [
            (0, utils_1.GetTreeItem)('', 'Формы', {
                icon: 'form',
                children: metadata.forms?.map((form) => (0, utils_1.GetTreeItem)(idPrefix + form.$_uuid, form.name, {
                    icon: 'form',
                    context: 'form',
                    path: `${idPrefix}${metadataType}/${metadata.name}/Forms/${form.name}`,
                    configType: 'edt',
                }))
            }),
            (0, utils_1.GetTreeItem)('', 'Команды', {
                icon: 'command',
                children: metadata.commands?.map((command) => (0, utils_1.GetTreeItem)(idPrefix + command.$_uuid, command.name, {
                    icon: 'command',
                    context: 'command',
                    path: `${idPrefix}${metadataType}/${metadata.name}/Commands/${command.name}`,
                    configType: 'edt',
                }))
            }),
            (0, utils_1.GetTreeItem)('', 'Макеты', {
                icon: 'template',
                children: metadata.templates?.map((template) => {
                    const path = `${idPrefix}${metadataType}/${metadata.name}/Templates/${template.name}`;
                    return (0, utils_1.GetTreeItem)(idPrefix + template.$_uuid, template.name, {
                        icon: 'template',
                        command: 'metadataViewer.showTemplate',
                        commandTitle: 'Show template',
                        commandArguments: [path],
                        path: path,
                        configType: 'edt',
                    });
                })
            }),
        ];
    }
    fillDocumentJournalItemsByMetadata(idPrefix, metadata) {
        const items = [
            (0, utils_1.GetTreeItem)('', 'Графы', { icon: 'column', children: metadata.columns?.
                    map((column) => (0, utils_1.GetTreeItem)(idPrefix + column.$_uuid, column.name, {
                    icon: 'template'
                }))
            }),
        ];
        return [...items, ...this.fillCommonItems(idPrefix, 'DocumentJournals', metadata)];
    }
    fillEnumItemsByMetadata(idPrefix, metadata) {
        const items = [
            (0, utils_1.GetTreeItem)('', 'Значения', { icon: 'attribute', children: metadata.enumValues?.
                    map((enumValue) => (0, utils_1.GetTreeItem)(idPrefix + enumValue.$_uuid, enumValue.name, {
                    icon: 'attribute'
                }))
            }),
        ];
        return [...items, ...this.fillCommonItems(idPrefix, 'Enums', metadata)];
    }
    fillChartOfAccountsItemsByMetadata(idPrefix, metadata) {
        const items = [
            (0, utils_1.GetTreeItem)('', 'Признаки учета', { icon: 'accountingFlag', children: metadata.accountingFlags?.
                    map((accountingFlag) => (0, utils_1.GetTreeItem)(idPrefix + accountingFlag.$_uuid, accountingFlag.name, {
                    icon: 'accountingFlag'
                }))
            }),
            (0, utils_1.GetTreeItem)('', 'Признаки учета субконто', { icon: 'extDimensionAccountingFlag',
                children: metadata.extDimensionAccountingFlags?.
                    map((extDimensionAccountingFlag) => (0, utils_1.GetTreeItem)(idPrefix + extDimensionAccountingFlag.$_uuid, extDimensionAccountingFlag.name, {
                    icon: 'extDimensionAccountingFlag'
                }))
            }),
        ];
        return [...items, ...this.fillObjectItemsByMetadata(idPrefix, 'ChartsOfAccounts', metadata)]
            .sort((x, y) => { return x.label == "Реквизиты" ? -1 : y.label == "Реквизиты" ? 1 : 0; });
    }
    fillRegisterItemsByMetadata(idPrefix, metadataType, metadata) {
        const items = [
            (0, utils_1.GetTreeItem)('', 'Измерения', { icon: 'dimension', children: metadata.dimensions?.
                    map((dimension) => (0, utils_1.GetTreeItem)(idPrefix + dimension.$_uuid, dimension.name, { icon: 'dimension' }))
            }),
            (0, utils_1.GetTreeItem)('', 'Ресурсы', { icon: 'resource', children: metadata.resources?.
                    map((resource) => (0, utils_1.GetTreeItem)(idPrefix + resource.$_uuid, resource.name, { icon: 'resource' }))
            }),
            (0, utils_1.GetTreeItem)('', 'Реквизиты', { icon: 'attribute', children: metadata.attributes?.
                    map((attr) => (0, utils_1.GetTreeItem)(idPrefix + attr.$_uuid, attr.name, { icon: 'attribute' }))
            }),
        ];
        return [...items, ...this.fillCommonItems(idPrefix, metadataType, metadata)];
    }
    fillCalculationRegisterItemsByMetadata(idPrefix, metadata) {
        const items = [
        // TODO: Перерасчеты
        ];
        return [...items, ...this.fillRegisterItemsByMetadata(idPrefix, 'CalculationRegisters', metadata)];
    }
    fillTaskItemsByMetadata(idPrefix, metadata) {
        const items = [
            (0, utils_1.GetTreeItem)('', 'Реквизиты адресации', { icon: 'attribute', children: metadata.addressingAttributes?.
                    map((attr) => (0, utils_1.GetTreeItem)(idPrefix + attr.$_uuid, attr.name, { icon: 'attribute' }))
            }),
        ];
        return [...items, ...this.fillObjectItemsByMetadata(idPrefix, 'Tasks', metadata)]
            .sort((x, y) => { return x.label == "Реквизиты" ? -1 : y.label == "Реквизиты" ? 1 : 0; });
    }
    fillExternalDataSourceItemsByMetadata(idPrefix, metadata) {
        const items = [
        // TODO:
        ];
        return items;
    }
}
exports.Edt = Edt;
//# sourceMappingURL=edt.js.map