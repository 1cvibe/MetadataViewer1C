"use strict";
/**
 * Словарь соответствия типов метаданных и их русских названий
 * Используется для универсального преобразования типов ссылок в webview
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefBSLMap = exports.createRefDisplayMap = exports.createRefTypeMap = exports.METADATA_TYPES = void 0;
/**
 * Полный словарь типов метаданных 1С
 */
exports.METADATA_TYPES = [
    { type: 'Catalog', displayName: 'Справочник', refType: 'CatalogRef', refDisplayName: 'Справочник', objectType: 'CatalogObject', objectDisplayName: 'СправочникОбъект', managerType: 'CatalogManager', managerDisplayName: 'СправочникМенеджер' },
    { type: 'Document', displayName: 'Документ', refType: 'DocumentRef', refDisplayName: 'Документ', objectType: 'DocumentObject', objectDisplayName: 'ДокументОбъект', managerType: 'DocumentManager', managerDisplayName: 'ДокументМенеджер' },
    { type: 'Enum', displayName: 'Перечисление', refType: 'EnumRef', refDisplayName: 'Перечисление' },
    { type: 'Report', displayName: 'Отчет', refType: 'ReportRef', refDisplayName: 'Отчет' },
    { type: 'DataProcessor', displayName: 'Обработка', refType: 'DataProcessorRef', refDisplayName: 'Обработка' },
    { type: 'ChartOfCharacteristicTypes', displayName: 'План видов характеристик', refType: 'ChartOfCharacteristicTypesRef', refDisplayName: 'План видов характеристик' },
    { type: 'ChartOfAccounts', displayName: 'План счетов', refType: 'ChartOfAccountsRef', refDisplayName: 'План счетов' },
    { type: 'ChartOfCalculationTypes', displayName: 'План видов расчета', refType: 'ChartOfCalculationTypesRef', refDisplayName: 'План видов расчета' },
    { type: 'InformationRegister', displayName: 'Регистр сведений', refType: 'InformationRegisterRef', refDisplayName: 'Регистр сведений' },
    { type: 'AccumulationRegister', displayName: 'Регистр накопления', refType: 'AccumulationRegisterRef', refDisplayName: 'Регистр накопления' },
    { type: 'AccountingRegister', displayName: 'Регистр бухгалтерии', refType: 'AccountingRegisterRef', refDisplayName: 'Регистр бухгалтерии' },
    { type: 'CalculationRegister', displayName: 'Регистр расчета', refType: 'CalculationRegisterRef', refDisplayName: 'Регистр расчета' },
    { type: 'BusinessProcess', displayName: 'Бизнес-процесс', refType: 'BusinessProcessRef', refDisplayName: 'Бизнес-процесс' },
    { type: 'Task', displayName: 'Задача', refType: 'TaskRef', refDisplayName: 'Задача' },
    { type: 'Constant', displayName: 'Константа', refType: 'ConstantRef', refDisplayName: 'Константа' },
    { type: 'CommonModule', displayName: 'Общий модуль', refType: 'CommonModuleRef', refDisplayName: 'Общий модуль' },
    { type: 'CommonForm', displayName: 'Общая форма', refType: 'CommonFormRef', refDisplayName: 'Общая форма' },
    { type: 'ExternalDataSource', displayName: 'Внешний источник данных', refType: 'ExternalDataSourceRef', refDisplayName: 'Внешний источник данных' },
    { type: 'DefinedType', displayName: 'Определяемый тип', refType: 'DefinedTypeRef', refDisplayName: 'Определяемый тип' },
    { type: 'ExchangePlan', displayName: 'План обмена', refType: 'ExchangePlanRef', refDisplayName: 'План обмена' },
    { type: 'DocumentJournal', displayName: 'Журнал документов', refType: 'DocumentJournalRef', refDisplayName: 'Журнал документов' },
    { type: 'Sequence', displayName: 'Последовательность', refType: 'SequenceRef', refDisplayName: 'Последовательность' },
    { type: 'DocumentNumerator', displayName: 'Нумератор документов', refType: 'DocumentNumeratorRef', refDisplayName: 'Нумератор документов' },
    { type: 'WebService', displayName: 'Веб-сервис', refType: 'WebServiceRef', refDisplayName: 'Веб-сервис' },
    { type: 'HTTPService', displayName: 'HTTP-сервис', refType: 'HTTPServiceRef', refDisplayName: 'HTTP-сервис' },
    { type: 'Subsystem', displayName: 'Подсистема', refType: 'SubsystemRef', refDisplayName: 'Подсистема' },
    { type: 'Role', displayName: 'Роль', refType: 'RoleRef', refDisplayName: 'Роль' },
    { type: 'SessionParameter', displayName: 'Параметр сеанса', refType: 'SessionParameterRef', refDisplayName: 'Параметр сеанса' },
    { type: 'CommonAttribute', displayName: 'Общий реквизит', refType: 'CommonAttributeRef', refDisplayName: 'Общий реквизит' },
    { type: 'EventSubscription', displayName: 'Подписка на событие', refType: 'EventSubscriptionRef', refDisplayName: 'Подписка на событие' },
    { type: 'ScheduledJob', displayName: 'Регламентное задание', refType: 'ScheduledJobRef', refDisplayName: 'Регламентное задание' },
    { type: 'CommonCommand', displayName: 'Общая команда', refType: 'CommonCommandRef', refDisplayName: 'Общая команда' },
    { type: 'CommandGroup', displayName: 'Группа команд', refType: 'CommandGroupRef', refDisplayName: 'Группа команд' },
    { type: 'CommonTemplate', displayName: 'Общий макет', refType: 'CommonTemplateRef', refDisplayName: 'Общий макет' },
    { type: 'CommonPicture', displayName: 'Общая картинка', refType: 'CommonPictureRef', refDisplayName: 'Общая картинка' },
    { type: 'WSReference', displayName: 'WS-ссылка', refType: 'WSReferenceRef', refDisplayName: 'WS-ссылка' },
    { type: 'Style', displayName: 'Стиль', refType: 'StyleRef', refDisplayName: 'Стиль' },
    { type: 'StyleItem', displayName: 'Элемент стиля', refType: 'StyleItemRef', refDisplayName: 'Элемент стиля' },
    { type: 'FilterCriterion', displayName: 'Критерий отбора', refType: 'FilterCriterionRef', refDisplayName: 'Критерий отбора' },
    { type: 'FunctionalOption', displayName: 'Функциональная опция', refType: 'FunctionalOptionRef', refDisplayName: 'Функциональная опция' },
    { type: 'FunctionalOptionsParameter', displayName: 'Параметр функциональных опций', refType: 'FunctionalOptionsParameterRef', refDisplayName: 'Параметр функциональных опций' },
    { type: 'SettingsStorage', displayName: 'Хранилище настроек', refType: 'SettingsStorageRef', refDisplayName: 'Хранилище настроек' },
];
/**
 * Создает словарь для быстрого поиска по типу ссылки
 */
function createRefTypeMap() {
    const map = {};
    for (const mapping of exports.METADATA_TYPES) {
        map[mapping.refType] = mapping.refDisplayName;
        if (mapping.objectType) {
            const objectType = mapping.objectType;
            map[objectType] = mapping.objectDisplayName;
        }
        if (mapping.managerType) {
            const managerType = mapping.managerType;
            map[managerType] = mapping.managerDisplayName;
        }
    }
    return map;
}
exports.createRefTypeMap = createRefTypeMap;
/**
 * Создает словарь для преобразования типов ссылок в русские названия для отображения
 */
function createRefDisplayMap() {
    const map = {};
    for (const mapping of exports.METADATA_TYPES) {
        map[mapping.refType] = `${mapping.displayName}: `;
    }
    return map;
}
exports.createRefDisplayMap = createRefDisplayMap;
/**
 * Создает словарь для преобразования типов в BSL формат (для сохранения)
 * Использует точные соответствия из существующего кода
 */
function createRefBSLMap() {
    const map = {};
    // Точные соответствия из существующего кода
    const bslMappings = {
        'CatalogRef': 'СправочникСсылка',
        'DocumentRef': 'ДокументСсылка',
        'EnumRef': 'ПеречислениеСсылка',
        'ChartOfAccountsRef': 'ПланСчетовСсылка',
        'ChartOfCalculationTypesRef': 'ПланВидовРасчетаСсылка',
        'ChartOfCharacteristicTypesRef': 'ПланВидовХарактеристикСсылка',
        'InformationRegisterRef': 'РегистрСведенийСсылка',
        'AccumulationRegisterRef': 'РегистрНакопленияСсылка',
        'AccountingRegisterRef': 'РегистрБухгалтерииСсылка',
        'CalculationRegisterRef': 'РегистрРасчетаСсылка',
        'DocumentObject': 'ДокументОбъект',
        'CatalogObject': 'СправочникОбъект',
        'CatalogManager': 'СправочникМенеджер',
        'DocumentManager': 'ДокументМенеджер',
    };
    // Добавляем точные соответствия
    for (const [key, value] of Object.entries(bslMappings)) {
        map[key] = value;
    }
    /**
     * Преобразует русское название в BSL формат (каждое слово с заглавной буквы)
     * Например: "Общий модуль" -> "ОбщийМодуль"
     */
    function toBSLName(displayName) {
        return displayName
            .split(/[\s-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    // Для остальных типов используем универсальное преобразование
    for (const mapping of exports.METADATA_TYPES) {
        const refType = mapping.refType;
        if (!map[refType]) {
            // Универсальное преобразование: каждое слово с заглавной буквы + "Ссылка"
            const bslName = toBSLName(mapping.displayName) + 'Ссылка';
            map[refType] = bslName;
        }
        // Обработка objectType
        if (mapping.objectType) {
            const objectType = mapping.objectType;
            if (!map[objectType]) {
                const bslName = toBSLName(mapping.displayName) + 'Объект';
                map[objectType] = bslName;
            }
        }
        // Обработка managerType
        if (mapping.managerType) {
            const managerType = mapping.managerType;
            if (!map[managerType]) {
                const bslName = toBSLName(mapping.displayName) + 'Менеджер';
                map[managerType] = bslName;
            }
        }
    }
    return map;
}
exports.createRefBSLMap = createRefBSLMap;
//# sourceMappingURL=metadata-types.js.map