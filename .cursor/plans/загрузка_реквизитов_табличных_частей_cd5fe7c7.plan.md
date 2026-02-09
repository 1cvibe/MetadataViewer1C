---
name: Загрузка реквизитов табличных частей
overview: Реализовать загрузку и отображение реквизитов табличных частей в дереве метаданных и автодополнении запросов 1С. Сейчас табличные части отображаются, но их реквизиты не загружаются, так как они находятся в общем массиве `members` и не связаны с табличной частью в дереве.
todos: []
---

# Загрузка реквизитов табличных частей в дерево метаданных

## Проблема

В дереве метаданных отображаются табличные части объектов, но их реквизиты (атрибуты) не загружаются. Это происходит потому что:

1. В `UniversalMetadataParser.ts` функция `parseChildObjectsDeep` парсит все элементы, включая атрибуты табличных частей, в общий массив `members`
2. Атрибуты табличных частей имеют путь вида `["ChildObjects", "TabularSection", "Товары", "ChildObjects", "Attribute", "Номенклатура"]`
3. В `MetadataRepository.ts` функция `buildMemberChildren` не находит атрибуты табличных частей, так как она работает только с упрощенной структурой пути

## Решение

### 1. Модификация `buildMemberChildren` в `MetadataRepository.ts`

**Файл:** `src/autogen-bsl/metadata/MetadataRepository.ts`**Изменения:**

- Модифицировать функцию `buildMemberChildren`, чтобы она находила атрибуты табличных частей по пути
- Если `member.kind === "TabularSection"`, найти все атрибуты из `object.members`, которые имеют путь, начинающийся с `["ChildObjects", "TabularSection", member.name, "ChildObjects", "Attribute"]`
- Создать узлы для этих атрибутов как детей табличной части

**Код:**

```typescript
function buildMemberChildren(objectId: string, member: any, object?: ParsedMetadataObject): MetadataTreeNode[] | undefined {
  // Для табличных частей ищем их атрибуты в object.members
  if (member.kind === "TabularSection" && object?.members && member.name) {
    const tabularSectionPath = ["ChildObjects", "TabularSection", member.name, "ChildObjects", "Attribute"];
    const attributes = object.members.filter((m: MetadataMember) => {
      if (m.kind !== "Attribute") return false;
      const path = m.path || [];
      // Проверяем, что путь начинается с пути табличной части
      if (path.length < tabularSectionPath.length) return false;
      for (let i = 0; i < tabularSectionPath.length; i++) {
        if (path[i] !== tabularSectionPath[i]) return false;
      }
      return true;
    });
    
    if (attributes.length > 0) {
      return attributes.map((attr: MetadataMember, idx: number) => ({
        id: `${objectId}/TabularSection/${member.name}/Attribute/${attr.name || idx}`,
        label: String(attr.name || attr.kind || idx),
        kind: "member" as const,
        member: attr
      }));
    }
  }
  
  // Существующая логика для других случаев
  const p: string[] | undefined = member?.path;
  if (!p || p.length < 4) return undefined;
  // ... остальной код
}
```



### 2. Обновление вызова `buildMemberChildren`

**Файл:** `src/autogen-bsl/metadata/MetadataRepository.ts`**Изменения:**

- Передать объект `o` в функцию `buildMemberChildren` при создании узлов табличных частей

**Код:**

```typescript
const children: MetadataTreeNode[] = members
  .slice()
  .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"))
  .map((m, idx) => ({
    id: `${root.id}/${title}/${m.name || idx}`,
    label: String(m.name || m.kind || idx),
    kind: "member",
    member: m,
    children: buildMemberChildren(root.id, m, o) // Передаем объект
  }));
```



### 3. Передача `debugMode` в webview

**Файл:** `src/queryStringEditor.ts`**Изменения:**

- Получить значение `debugMode` из настроек расширения перед отправкой данных в webview
- Передать `debugMode` в webview через `postMessage`

**Код:**

```typescript
// В методе openQueryEditor или аналогичном, перед отправкой данных
const config = vscode.workspace.getConfiguration();
const debugMode = config.get<boolean>('metadataViewer.debugMode', false);

// При отправке данных в webview
panel.webview.postMessage({
  type: "standaloneQueryEditorInit",
  payload: {
    queryText: queryText || '',
    metadata,
    metadataTree,
    debugMode, // Добавляем debugMode
  },
});
```



### 4. Сохранение `debugMode` в webview

**Файл:** `src/webview/components/StandaloneQueryEditor.tsx` (или аналогичный компонент, который обрабатывает сообщения)**Изменения:**

- При получении сообщения `standaloneQueryEditorInit` сохранить `debugMode` в глобальной переменной
- Использовать эту переменную для условного логирования в других модулях webview

**Код:**

```typescript
// В компоненте, который обрабатывает сообщения
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    if (message.type === 'standaloneQueryEditorInit') {
      const debugMode = message.payload?.debugMode || false;
      // Сохраняем в глобальной переменной для использования в monacoQueryLanguage.ts
      (globalThis as any).__MDV_QUERY_DEBUG__ = debugMode;
      // ... остальная обработка
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```



### 5. Условное логирование в `queryStringEditor.ts`

**Файл:** `src/queryStringEditor.ts`**Изменения:**

- Заменить все безусловные `console.log` на условные, проверяющие `debugMode`
- Удалить отладочные логи, которые были добавлены ранее (строки 363-376, 423-435)

**Код:**

```typescript
// Получаем debugMode в начале функции toWeb или передаем как параметр
const config = vscode.workspace.getConfiguration();
const debugMode = config.get<boolean>('metadataViewer.debugMode', false);

// Используем условное логирование
if (debugMode && isTabularSection) {
  console.log('[queryStringEditor.toWeb] Found tabular section:', {
    memberName,
    insertText: ctx.prefix && ctx.objectName ? `${ctx.prefix}.${ctx.objectName}.${memberName}` : undefined,
    childrenCount: (n.children || []).length,
    // ... остальные данные
  });
}
```



### 6. Условное логирование в `monacoQueryLanguage.ts`

**Файл:** `src/webview/utils/monacoQueryLanguage.ts`**Изменения:**

- Заменить все безусловные `console.log` и `console.dir` на условные, проверяющие `(globalThis as any).__MDV_QUERY_DEBUG__`
- Удалить отладочные логи, которые были добавлены ранее

**Код:**

```typescript
// В начале функций использовать проверку
const debugMode = (globalThis as any).__MDV_QUERY_DEBUG__ === true;

if (debugMode) {
  console.log('[setQueryMetadataCompletionTree] Processing tabular section:');
  console.dir({
    tabularSectionKey,
    insertText,
    childrenCount,
    // ... остальные данные
  }, { depth: null });
}
```



### 7. Проверка обработки реквизитов табличных частей

**Файл:** `src/queryStringEditor.ts`**Изменения:**

- Убедиться, что функция `toWeb` правильно обрабатывает реквизиты табличных частей, которые теперь будут приходить как дети табличной части
- Убедиться, что обработка детей табличной части (строки 394-443) работает корректно

**Файл:** `src/webview/utils/monacoQueryLanguage.ts`**Изменения:**

- Убедиться, что функция `setQueryMetadataCompletionTree` правильно обрабатывает реквизиты табличных частей
- Убедиться, что обработка реквизитов табличных частей (строки 290-358) работает корректно

## Ожидаемый результат

После реализации:

1. В дереве метаданных табличные части будут иметь детей - реквизиты табличной части
2. При автодополнении запросов будут доступны реквизиты табличных частей
3. Реквизиты будут правильно обрабатываться при использовании алиасов табличных частей

## Тестирование

1. Открыть редактор запросов
2. Выбрать объект с табличной частью (например, справочник "Вакансии")
3. Проверить, что табличная часть имеет детей - реквизиты
4. Проверить автодополнение для алиаса табличной части (например, `ДДД1.` где `ДДД1` - алиас табличной части)