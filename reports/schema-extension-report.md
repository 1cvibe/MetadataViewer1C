# Отчет о расширении схем объектов метаданных

**Дата создания: 21.01.2026
**Источник данных:** `E:\DATA1C\RZDZUP\src\cf`

---

## Сводка

- **Всего проанализировано типов объектов:** [будет заполнено]
- **Всего проанализировано объектов:** [будет заполнено]
- **Всего добавлено схем:** [будет заполнено]
- **Всего добавлено свойств:** [будет заполнено]

---

## Детали по типам объектов

### Report (Отчет)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `DefaultForm` (тип: string)
  - `AuxiliaryForm` (тип: string)
  - `MainDataCompositionSchema` (тип: string)
  - `DefaultSettingsForm` (тип: string)
  - `AuxiliarySettingsForm` (тип: string)
  - `DefaultVariantForm` (тип: string)
  - `VariantsStorage` (тип: string)
  - `SettingsStorage` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `ExtendedPresentation` (тип: string)
  - `Explanation` (тип: string)
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - `attributeSchema` - для реквизитов
  - `formSchema` - для форм
  - `commandSchema` - для команд

---

### DataProcessor (Обработка)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `DefaultForm` (тип: string)
  - `AuxiliaryForm` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `ExtendedPresentation` (тип: string)
  - `Explanation` (тип: string)
- **Добавленные атрибуты:** Да (используется formSchema)
- **Добавленные табличные части:** нет
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### InformationRegister (Регистр сведений)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `EditType` (тип: string)
  - `DefaultRecordForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `AuxiliaryRecordForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `InformationRegisterPeriodicity` (тип: string)
  - `WriteMode` (тип: string)
  - `MainFilterOnPeriod` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `EnableTotalsSliceFirst` (тип: string)
  - `EnableTotalsSliceLast` (тип: string)
  - `RecordPresentation` (тип: string)
  - `ExtendedRecordPresentation` (тип: string)
  - `ListPresentation` (тип: string)
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
- **Специфичные элементы:**
  - `Dimensions` - измерения регистра
  - `Resources` - ресурсы регистра
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### AccumulationRegister (Регистр накопления)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `DefaultListForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `RegisterType` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `EnableTotalsSplitting` (тип: string)
  - `ListPresentation` (тип: string)
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
- **Специфичные элементы:**
  - `Dimensions` - измерения регистра
  - `Resources` - ресурсы регистра
  - `Measures` - показатели регистра
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### CalculationRegister (Регистр расчета)

- **Количество проанализированных объектов:** 2
- **Добавленные свойства:**
  -   - `DefaultListForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `Periodicity` (тип: string)
  - `ActionPeriod` (тип: string)
  - `BasePeriod` (тип: string)
  - `Schedule` (тип: string)
  - `ScheduleValue` (тип: string)
  - `ScheduleDate` (тип: string)
  - `ChartOfCalculationTypes` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ListPresentation` (тип: string)
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
- **Специфичные элементы:**
  - `Dimensions` - измерения регистра
  - `Resources` - ресурсы регистра
  - `Recalculation` - пересчет
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### AccountingRegister (Регистр бухгалтерии)

- **Количество проанализированных объектов:** [будет заполнено]
- **Добавленные свойства:**
  - [Список будет заполнен после анализа]
- **Специфичные элементы:**
  - `Dimensions` - измерения регистра
  - `Resources` - ресурсы регистра
  - `AccountingFlag` - признак учета
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### BusinessProcess (Бизнес-процесс)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `EditType` (тип: string)
  - `InputByString` (тип: object)
  - `CreateOnInput` (тип: string)
  - `SearchStringModeOnInputByString` (тип: string)
  - `ChoiceDataGetModeOnInputByString` (тип: string)
  - `FullTextSearchOnInputByString` (тип: string)
  - `DefaultObjectForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `DefaultChoiceForm` (тип: string)
  - `AuxiliaryObjectForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `AuxiliaryChoiceForm` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `NumberType` (тип: string)
  - `NumberLength` (тип: number)
  - `NumberAllowedLength` (тип: string)
  - `CheckUnique` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
  - `Characteristics` (тип: string)
  - `Autonumbering` (тип: string)
  - `BasedOn` (тип: object | string)
  - `NumberPeriodicity` (тип: string)
  - `Task` (тип: string)
  - `CreateTaskInPrivilegedMode` (тип: string)
  - `DataLockFields` (тип: object)
  - `DataLockControlMode` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ObjectPresentation` (тип: string)
  - `ExtendedObjectPresentation` (тип: string)
  - `ListPresentation` (тип: multilingual (многоязычное))
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: multilingual (многоязычное))
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### Task (Задача)

- **Количество проанализированных объектов:** 2
- **Добавленные свойства:**
  -   - `NumberType` (тип: string)
  - `NumberLength` (тип: number)
  - `NumberAllowedLength` (тип: string)
  - `CheckUnique` (тип: string)
  - `Autonumbering` (тип: string)
  - `TaskNumberAutoPrefix` (тип: string)
  - `DescriptionLength` (тип: number)
  - `Addressing` (тип: string)
  - `MainAddressingAttribute` (тип: string)
  - `CurrentPerformer` (тип: string)
  - `BasedOn` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
  - `Characteristics` (тип: string)
  - `DefaultPresentation` (тип: string)
  - `EditType` (тип: string)
  - `InputByString` (тип: object)
  - `SearchStringModeOnInputByString` (тип: string)
  - `FullTextSearchOnInputByString` (тип: string)
  - `ChoiceDataGetModeOnInputByString` (тип: string)
  - `CreateOnInput` (тип: string)
  - `DefaultObjectForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `DefaultChoiceForm` (тип: string)
  - `AuxiliaryObjectForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `AuxiliaryChoiceForm` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `DataLockFields` (тип: object | string)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ObjectPresentation` (тип: string)
  - `ExtendedObjectPresentation` (тип: string)
  - `ListPresentation` (тип: multilingual (многоязычное))
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### ChartOfCharacteristicTypes (План видов характеристик)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `IncludeHelpInContents` (тип: string)
  - `CharacteristicExtValues` (тип: string)
  - `Type` (тип: object)
  - `Hierarchical` (тип: string)
  - `FoldersOnTop` (тип: string)
  - `CodeLength` (тип: number)
  - `CodeAllowedLength` (тип: string)
  - `DescriptionLength` (тип: number)
  - `CodeSeries` (тип: string)
  - `CheckUnique` (тип: string)
  - `Autonumbering` (тип: string)
  - `DefaultPresentation` (тип: string)
  - `Characteristics` (тип: string)
  - `PredefinedDataUpdate` (тип: string)
  - `EditType` (тип: string)
  - `QuickChoice` (тип: string)
  - `ChoiceMode` (тип: string)
  - `InputByString` (тип: object)
  - `CreateOnInput` (тип: string)
  - `SearchStringModeOnInputByString` (тип: string)
  - `ChoiceDataGetModeOnInputByString` (тип: string)
  - `FullTextSearchOnInputByString` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `DefaultObjectForm` (тип: string)
  - `DefaultFolderForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `DefaultChoiceForm` (тип: string)
  - `DefaultFolderChoiceForm` (тип: string)
  - `AuxiliaryObjectForm` (тип: string)
  - `AuxiliaryFolderForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `AuxiliaryChoiceForm` (тип: string)
  - `AuxiliaryFolderChoiceForm` (тип: string)
  - `BasedOn` (тип: string)
  - `DataLockFields` (тип: string)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ObjectPresentation` (тип: string | multilingual (многоязычное))
  - `ExtendedObjectPresentation` (тип: string)
  - `ListPresentation` (тип: string)
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
- **Специфичные элементы:**
  - `Characteristic` - вид характеристики
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### ChartOfAccounts (План счетов)

- **Количество проанализированных объектов:** [будет заполнено]
- **Добавленные свойства:**
  - [Список будет заполнен после анализа]
- **Специфичные элементы:**
  - `Account` - счет
  - `ChartOfAccountsType` - тип плана счетов
  - `AccountCodeLength` - длина кода счета
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### ChartOfCalculationTypes (План видов расчета)

- **Количество проанализированных объектов:** 2
- **Добавленные свойства:**
  -   - `CodeLength` (тип: number)
  - `DescriptionLength` (тип: number)
  - `CodeType` (тип: string)
  - `CodeAllowedLength` (тип: string)
  - `DefaultPresentation` (тип: string)
  - `EditType` (тип: string)
  - `QuickChoice` (тип: string)
  - `ChoiceMode` (тип: string)
  - `InputByString` (тип: object)
  - `SearchStringModeOnInputByString` (тип: string)
  - `FullTextSearchOnInputByString` (тип: string)
  - `ChoiceDataGetModeOnInputByString` (тип: string)
  - `CreateOnInput` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `DefaultObjectForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `DefaultChoiceForm` (тип: string)
  - `AuxiliaryObjectForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `AuxiliaryChoiceForm` (тип: string)
  - `BasedOn` (тип: string)
  - `DependenceOnCalculationTypes` (тип: string)
  - `BaseCalculationTypes` (тип: object)
  - `ActionPeriodUse` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
  - `Characteristics` (тип: object)
  - `StandardTabularSections` (тип: object)
  - `PredefinedDataUpdate` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `DataLockFields` (тип: string)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ObjectPresentation` (тип: multilingual (многоязычное))
  - `ExtendedObjectPresentation` (тип: string)
  - `ListPresentation` (тип: string)
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
- **Специфичные элементы:**
  - `CalculationType` - вид расчета
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### Constant (Константа)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `Type` (тип: object)
  - `DefaultForm` (тип: string)
  - `ExtendedPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `PasswordMode` (тип: string)
  - `Format` (тип: string)
  - `EditFormat` (тип: string)
  - `ToolTip` (тип: string)
  - `MarkNegatives` (тип: string)
  - `Mask` (тип: string)
  - `MultiLine` (тип: string)
  - `ExtendedEdit` (тип: string)
  - `MinValue` (тип: object)
  - `MaxValue` (тип: object)
  - `FillChecking` (тип: string)
  - `ChoiceFoldersAndItems` (тип: string)
  - `ChoiceParameterLinks` (тип: string)
  - `ChoiceParameters` (тип: string)
  - `QuickChoice` (тип: string)
  - `ChoiceForm` (тип: string)
  - `LinkByType` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `DataLockControlMode` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
- **Специфичные элементы:**
  - `Type` - тип константы
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### CommonModule (Общий модуль)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `Global` (тип: string)
  - `ClientManagedApplication` (тип: string)
  - `Server` (тип: string)
  - `ExternalConnection` (тип: string)
  - `ClientOrdinaryApplication` (тип: string)
  - `ServerCall` (тип: string)
  - `Privileged` (тип: string)
  - `ReturnValuesReuse` (тип: string)
- **Специфичные элементы:**
  - `Server` - серверный вызов
  - `Client` - клиентский вызов
  - `ExternalConnection` - внешнее соединение
  - `ClientOrdinaryApplication` - клиентское обычное приложение
  - `ClientManagedApplication` - клиентское управляемое приложение
  - `ServerCall` - серверный вызов
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### CommonForm (Общая форма)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `FormType` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `UsePurposes` (тип: object)
  - `ExtendedPresentation` (тип: string)
  - `Explanation` (тип: string)
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### ExchangePlan (План обмена)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `CodeLength` (тип: number)
  - `CodeAllowedLength` (тип: string)
  - `DescriptionLength` (тип: number)
  - `DefaultPresentation` (тип: string)
  - `EditType` (тип: string)
  - `QuickChoice` (тип: string)
  - `ChoiceMode` (тип: string)
  - `InputByString` (тип: object)
  - `SearchStringModeOnInputByString` (тип: string)
  - `FullTextSearchOnInputByString` (тип: string)
  - `ChoiceDataGetModeOnInputByString` (тип: string)
  - `DefaultObjectForm` (тип: string)
  - `DefaultListForm` (тип: string)
  - `DefaultChoiceForm` (тип: string)
  - `AuxiliaryObjectForm` (тип: string)
  - `AuxiliaryListForm` (тип: string)
  - `AuxiliaryChoiceForm` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
  - `Characteristics` (тип: string)
  - `BasedOn` (тип: string)
  - `DistributedInfoBase` (тип: string)
  - `IncludeConfigurationExtensions` (тип: string)
  - `CreateOnInput` (тип: string)
  - `ChoiceHistoryOnInput` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `DataLockFields` (тип: string | object)
  - `DataLockControlMode` (тип: string)
  - `FullTextSearch` (тип: string)
  - `ObjectPresentation` (тип: multilingual | string (многоязычное))
  - `ExtendedObjectPresentation` (тип: string | multilingual (многоязычное))
  - `ListPresentation` (тип: multilingual | string (многоязычное))
  - `ExtendedListPresentation` (тип: string)
  - `Explanation` (тип: string)
  - `DataHistory` (тип: string)
  - `UpdateDataHistoryImmediatelyAfterWrite` (тип: string)
  - `ExecuteAfterWriteDataHistoryVersionProcessing` (тип: string)
- **Специфичные элементы:**
  - `AutoRecord` - авторегистрация
  - `DataLockControlMode` - режим контроля блокировки данных
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### DocumentJournal (Журнал документов)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `DefaultForm` (тип: string)
  - `AuxiliaryForm` (тип: string)
  - `RegisteredDocuments` (тип: object)
  - `IncludeHelpInContents` (тип: string)
  - `ListPresentation` (тип: string | multilingual (многоязычное))
  - `ExtendedListPresentation` (тип: string | multilingual (многоязычное))
  - `Explanation` (тип: string)
  - `StandardAttributes` (тип: array | array<object> (массив))
- **Специфичные элементы:**
  - `Documents` - документы журнала
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### WebService (Веб-сервис)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `Namespace` (тип: string)
  - `XDTOPackages` (тип: object | string)
  - `DescriptorFileName` (тип: string)
  - `ReuseSessions` (тип: string)
  - `SessionMaxAge` (тип: number)
- **Специфичные элементы:**
  - `WSDLAddress` - адрес WSDL
  - `Namespace` - пространство имен
  - `WSReferences` - WS-ссылки
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### HTTPService (HTTP-сервис)

- **Количество проанализированных объектов:** 7
- **Добавленные свойства:**
  -   - `RootURL` (тип: string)
  - `ReuseSessions` (тип: string)
  - `SessionMaxAge` (тип: number)
- **Специфичные элементы:**
  - `URLTemplate` - шаблон URL
  - `AllowedMethods` - разрешенные методы
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** нет
- **Добавленные команды:** нет
- **Использованные вспомогательные схемы:**
  - [список]

---

### Subsystem (Подсистема)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `IncludeHelpInContents` (тип: string)
  - `IncludeInCommandInterface` (тип: string)
  - `UseOneCommand` (тип: string)
  - `Explanation` (тип: string | multilingual (многоязычное))
  - `Picture` (тип: object | string)
  - `Content` (тип: object | string)
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### Role (Роль)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  - - Нет специфичных свойств (используются только базовые)
- **Специфичные элементы:**
  - `RestrictionTemplates` - шаблоны ограничений
  - `RestrictionsByValues` - ограничения по значениям
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** нет
- **Добавленные команды:** нет
- **Использованные вспомогательные схемы:**
  - [список]

---

### ScheduledJob (Регламентное задание)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `MethodName` (тип: string)
  - `Description` (тип: string)
  - `Key` (тип: string)
  - `Use` (тип: string)
  - `Predefined` (тип: string)
  - `RestartCountOnFailure` (тип: number)
  - `RestartIntervalOnFailure` (тип: number)
- **Специфичные элементы:**
  - `MethodName` - имя метода
  - `Key` - ключ
  - `Use` - использование
  - `Predefined` - предопределенное
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### CommonCommand (Общая команда)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `Group` (тип: string)
  - `Representation` (тип: string)
  - `ToolTip` (тип: string)
  - `Picture` (тип: string)
  - `Shortcut` (тип: string)
  - `IncludeHelpInContents` (тип: string)
  - `CommandParameterType` (тип: string)
  - `ParameterUseMode` (тип: string)
  - `ModifiesData` (тип: string)
  - `OnMainServerUnavalableBehavior` (тип: string)
- **Добавленные атрибуты:** [список или "нет"]
- **Добавленные табличные части:** [список или "нет"]
- **Добавленные формы:** [список или "нет"]
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

### CommonTemplate (Общий макет)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `TemplateType` (тип: string)
- **Специфичные элементы:**
  - `TemplateType` - тип макета
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** нет
- **Добавленные команды:** нет
- **Использованные вспомогательные схемы:**
  - [список]

---

### CommonPicture (Общая картинка)

- **Количество проанализированных объектов:** 10
- **Добавленные свойства:**
  -   - `AvailabilityForChoice` (тип: string)
  - `AvailabilityForAppearance` (тип: string)
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** нет
- **Добавленные команды:** нет
- **Использованные вспомогательные схемы:**
  - [список]

---

### WSReference (WS-ссылка)

- **Количество проанализированных объектов:** 1
- **Добавленные свойства:**
  -   - `LocationURL` (тип: string)
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** нет
- **Добавленные формы:** нет
- **Добавленные команды:** нет
- **Использованные вспомогательные схемы:**
  - [список]

---

### SettingsStorage (Хранилище настроек)

- **Количество проанализированных объектов:** 4
- **Добавленные свойства:**
  -   - `DefaultSaveForm` (тип: string)
  - `DefaultLoadForm` (тип: string)
  - `AuxiliarySaveForm` (тип: string)
  - `AuxiliaryLoadForm` (тип: string)
- **Добавленные атрибуты:** нет
- **Добавленные табличные части:** Да (используется formSchema)
- **Добавленные формы:** нет
- **Добавленные команды:** [список или "нет"]
- **Использованные вспомогательные схемы:**
  - [список]

---

## Статистика по схемам

### Общие элементы
Свойства, используемые во всех типах:
- `Name` (string, обязательное) - имя объекта
- `Synonym` (multilingual, опциональное) - синоним
- `Comment` (multilingual, опциональное) - комментарий
- `UseStandardCommands` (boolean, опциональное) - использование стандартных команд

### Элементы, используемые в большинстве типов
- `attributes` - реквизиты (используется в: Document, Catalog, Report, DataProcessor, Register и т.д.)
- `forms` - формы (используется в: Document, Catalog, Report, DataProcessor, Register и т.д.)
- `commands` - команды (используется в: Document, Catalog, Report, DataProcessor, Register и т.д.)
- `tabularSections` - табличные части (используется в: Document, Catalog, Register и т.д.)

### Уникальные элементы
- `Dimensions` - только в регистрах (InformationRegister, AccumulationRegister, CalculationRegister, AccountingRegister)
- `Resources` - только в регистрах (InformationRegister, AccumulationRegister, CalculationRegister, AccountingRegister)
- `Measures` - только в регистрах накопления (AccumulationRegister)
- `AccountingFlag` - только в регистрах бухгалтерии (AccountingRegister)
- `Characteristic` - только в планах видов характеристик (ChartOfCharacteristicTypes)
- `Account` - только в планах счетов (ChartOfAccounts)
- `CalculationType` - только в планах видов расчета (ChartOfCalculationTypes)
- `Posting` - только в документах (Document)
- `Hierarchical` - только в справочниках (Catalog)
- `EnumValue` - только в перечислениях (Enum)

---

## Изменения в коде

### Измененные файлы
- `src/schemas/objectSchemas.ts` - добавлены новые схемы

### Добавленные экспорты
- `reportSchema`
- `dataProcessorSchema`
- `informationRegisterSchema`
- `accumulationRegisterSchema`
- `calculationRegisterSchema`
- `accountingRegisterSchema`
- `businessProcessSchema`
- `taskSchema`
- `chartOfCharacteristicTypesSchema`
- `chartOfAccountsSchema`
- `chartOfCalculationTypesSchema`
- `constantSchema`
- `commonModuleSchema`
- `commonFormSchema`
- `exchangePlanSchema`
- `documentJournalSchema`
- `webServiceSchema`
- `httpServiceSchema`
- `subsystemSchema`
- `roleSchema`
- `scheduledJobSchema`
- `commonCommandSchema`
- `commonTemplateSchema`
- `commonPictureSchema`
- `wsReferenceSchema`
- `settingsStorageSchema`

### Обновленный маппинг
```typescript
export const objectTypeSchemas: Record<string, JSONSchema7> = {
  Document: documentSchema,
  Catalog: catalogSchema,
  Enum: enumSchema,
  Form: formObjectSchema,
  // Новые схемы
  Report: reportSchema,
  DataProcessor: dataProcessorSchema,
  InformationRegister: informationRegisterSchema,
  AccumulationRegister: accumulationRegisterSchema,
  CalculationRegister: calculationRegisterSchema,
  AccountingRegister: accountingRegisterSchema,
  BusinessProcess: businessProcessSchema,
  Task: taskSchema,
  ChartOfCharacteristicTypes: chartOfCharacteristicTypesSchema,
  ChartOfAccounts: chartOfAccountsSchema,
  ChartOfCalculationTypes: chartOfCalculationTypesSchema,
  Constant: constantSchema,
  CommonModule: commonModuleSchema,
  CommonForm: commonFormSchema,
  ExchangePlan: exchangePlanSchema,
  DocumentJournal: documentJournalSchema,
  WebService: webServiceSchema,
  HTTPService: httpServiceSchema,
  Subsystem: subsystemSchema,
  Role: roleSchema,
  ScheduledJob: scheduledJobSchema,
  CommonCommand: commonCommandSchema,
  CommonTemplate: commonTemplateSchema,
  CommonPicture: commonPictureSchema,
  WSReference: wsReferenceSchema,
  SettingsStorage: settingsStorageSchema
};
```

---

## Примечания

- Все схемы используют `basePropertiesSchema` как основу
- Многоязычные поля используют `multilingualFieldSchema`
- Реквизиты используют `attributeSchema`
- Табличные части используют `tabularSectionSchema`
- Формы используют `formSchema`
- Команды используют `commandSchema`
- Для регистров дополнительно используются схемы для Dimensions и Resources
- Для планов счетов/расчетов/характеристик используются специфичные схемы для Account/CalculationType/Characteristic

---

## История изменений

- **[Дата]** - Создан отчет
- **[Дата]** - Начато расширение схем
- **[Дата]** - Завершено расширение схем
