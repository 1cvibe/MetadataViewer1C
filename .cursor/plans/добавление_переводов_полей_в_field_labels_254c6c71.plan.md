---
name: Добавление переводов полей в FIELD_LABELS
overview: Добавить переводы для отсутствующих полей объектов метаданных в FIELD_LABELS в файле field-values.ts на основе результатов анализа схем
todos:
  - id: analyze-existing
    content: Проанализировать существующие переводы в FIELD_LABELS и определить точные места для вставки новых переводов
    status: completed
  - id: add-missing-translations
    content: "Добавить переводы для 51 отсутствующего поля (20 из анализа объектов + 31 из схем). Список: AccumulationRegister, AuthenticationSeparation, AutoUse, AuxiliaryObjectForm, BusinessProcess, CalculationRegister, Category, ChartOfCharacteristicTypes, CodeType, CommandGroup, CommonAttribute, CommonCommand, CommonForm, CommonModule, CommonPicture, CommonTemplate, ConditionalSeparation, ConfigurationExtensionsSeparation, Constant, DataProcessor, DataSeparation, DataSeparationUse, DataSeparationValue, DefinedType, DocumentJournal, DocumentNumerator, Event, EventSubscription, ExchangePlan, FillValue, FilterCriterion, FunctionalOption, FunctionalOptionsParameter, HTTPService, Handler, InformationRegister, Location, Mask, PrivilegedGetMode, Report, Role, ScheduledJob, SeparatedDataUse, SessionParameter, Source, StyleItem, Subsystem, UsersSeparation, Value, WSReference, WebService"
    status: completed
  - id: check-schemas
    content: Проверить реальные XML файлы на наличие полей AutoOrderByCode и MaxExtDimensionCount (упомянутых пользователем), добавить переводы если найдены. Эти поля не обнаружены в схемах, возможно используются в других контекстах.
    status: completed
  - id: verify-translations
    content: Проверить корректность добавленных переводов, отсутствие дубликатов и синтаксические ошибки
    status: completed
---

# План добавления переводов полей в FIELD_LABELS

## Цель

Добавить переводы для всех полей объектов метаданных, которые были обнаружены при анализе схем, но отсутствуют в словаре переводов `FIELD_LABELS` в файле `src/Metadata/field-values.ts`.

## Обнаруженные отсутствующие переводы

На основе расширенного анализа:

- Анализ файла `scripts/analysis-results.json` (по 10 объектов каждого типа)
- Анализ всех полей из схем в `src/schemas/objectSchemas.ts` (199 полей)
- Сравнение с существующими переводами в `FIELD_LABELS` (163 перевода)

Обнаружено **51 отсутствующий перевод**:

### Поля из анализа объектов (20):

1. `AuthenticationSeparation` - Разделение аутентификации
2. `AutoUse` - Автоиспользование
3. `AuxiliaryObjectForm` - Вспомогательная форма объекта
4. `Category` - Категория
5. `CodeType` - Тип кода
6. `ConditionalSeparation` - Условное разделение
7. `ConfigurationExtensionsSeparation` - Разделение расширений конфигурации
8. `DataSeparation` - Разделение данных
9. `DataSeparationUse` - Использование разделения данных
10. `DataSeparationValue` - Значение разделения данных
11. `Event` - Событие
12. `FillValue` - Значение заполнения
13. `Handler` - Обработчик
14. `Location` - Расположение
15. `Mask` - Маска
16. `PrivilegedGetMode` - Режим получения в привилегированном режиме
17. `SeparatedDataUse` - Использование разделенных данных
18. `Source` - Источник
19. `UsersSeparation` - Разделение пользователей
20. `Value` - Значение

### Дополнительные поля из схем (31):

21. `AccumulationRegister` - Регистр накопления (тип объекта)
22. `BusinessProcess` - Бизнес-процесс (тип объекта)
23. `CalculationRegister` - Регистр расчета (тип объекта)
24. `ChartOfCharacteristicTypes` - План видов характеристик (тип объекта)
25. `CommandGroup` - Группа команд
26. `CommonAttribute` - Общий реквизит (тип объекта)
27. `CommonCommand` - Общая команда (тип объекта)
28. `CommonForm` - Общая форма (тип объекта)
29. `CommonModule` - Общий модуль (тип объекта)
30. `CommonPicture` - Общая картинка (тип объекта)
31. `CommonTemplate` - Общий макет (тип объекта)
32. `Constant` - Константа (тип объекта)
33. `DataProcessor` - Обработка (тип объекта)
34. `DefinedType` - Определяемый тип (тип объекта)
35. `DocumentJournal` - Журнал документов (тип объекта)
36. `DocumentNumerator` - Нумератор документов (тип объекта)
37. `EventSubscription` - Подписка на событие (тип объекта)
38. `ExchangePlan` - План обмена (тип объекта)
39. `FilterCriterion` - Критерий отбора (тип объекта)
40. `FunctionalOption` - Функциональная опция (тип объекта)
41. `FunctionalOptionsParameter` - Параметр функциональных опций (тип объекта)
42. `HTTPService` - HTTP-сервис (тип объекта)
43. `InformationRegister` - Регистр сведений (тип объекта)
44. `Report` - Отчет (тип объекта)
45. `Role` - Роль (тип объекта)
46. `ScheduledJob` - Регламентное задание (тип объекта)
47. `SessionParameter` - Параметр сеанса (тип объекта)
48. `StyleItem` - Элемент стиля (тип объекта)
49. `Subsystem` - Подсистема (тип объекта)
50. `WSReference` - WS-ссылка (тип объекта)
51. `WebService` - Веб-сервис (тип объекта)

## Дополнительные поля, упомянутые пользователем

Пользователь также упомянул поля, которые могут отсутствовать:

- `AutoOrderByCode` - Автосортировка по коду
- `MaxExtDimensionCount` - Максимальное количество внешних измерений

**Примечание:** Эти поля не найдены в схемах и результатах анализа. Возможно, они используются в других контекстах или являются устаревшими. Необходимо проверить в реальных XML файлах при необходимости.

## Шаги выполнения

### 1. Анализ существующих переводов

- Файл: `src/Metadata/field-values.ts`
- Текущее количество переводов: 163
- Новых переводов для добавления: 51
- Источники данных:
  - Анализ 10 объектов каждого типа из `E:\DATA1C\RZDZUP\src\cf` (20 полей)
  - Анализ всех полей из схем `src/schemas/objectSchemas.ts` (31 дополнительное поле)

### 2. Добавление переводов в FIELD_LABELS

- Открыть файл `src/Metadata/field-values.ts`
- Найти объект `FIELD_LABELS` (строки 251-415)
- Добавить новые переводы в алфавитном порядке или логически сгруппированные
- Сохранить файл

### 3. Проверка полей из схем

- Проверить файл `src/schemas/objectSchemas.ts` на наличие полей с `title`, которые не имеют переводов
- Добавить переводы для найденных полей

### 4. Верификация

- Проверить, что все новые переводы добавлены корректно
- Убедиться, что нет дубликатов ключей
- Проверить синтаксис TypeScript

## Структура добавляемых переводов

Каждый перевод добавляется в формате:

```typescript
'FieldName': 'Перевод на русский язык',
```

Переводы должны быть:

- Понятными и точными
- Соответствующими терминологии 1С:Предприятие
- Согласованными с существующими переводами

## Файлы для изменения

- `src/Metadata/field-values.ts` - добавление переводов в `FIELD_LABELS`

## Ожидаемый результат

После выполнения плана все поля, обнаруженные при анализе схем, будут иметь переводы в `FIELD_LABELS`, что обеспечит корректное отображение названий полей в интерфейсе редактора метаданных.