"use strict";
/**
 * Утилита для сравнения и слияния изменений в XML структуре
 * Сохраняет неизмененные поля из оригинальной структуры
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlDiffMerge = void 0;
const xmlStructureUtils_1 = require("./xmlStructureUtils");
class XmlDiffMerge {
    /**
     * Рекурсивно сравнивает два объекта и возвращает различия
     */
    static diff(original, changed, path = '') {
        if (original === changed) {
            return undefined; // Нет изменений
        }
        if (original === null || original === undefined) {
            return changed; // Новое значение
        }
        if (changed === null || changed === undefined) {
            return null; // Удалено
        }
        if (typeof original !== 'object' || typeof changed !== 'object') {
            return changed; // Примитивные значения изменились
        }
        if (Array.isArray(original) !== Array.isArray(changed)) {
            return changed; // Изменился тип (массив <-> объект)
        }
        if (Array.isArray(original) && Array.isArray(changed)) {
            // Для массивов сравниваем по индексам
            const maxLength = Math.max(original.length, changed.length);
            const diff = [];
            let hasChanges = false;
            for (let i = 0; i < maxLength; i++) {
                const origItem = original[i];
                const changedItem = changed[i];
                if (i >= original.length) {
                    // Новый элемент
                    diff.push(changedItem);
                    hasChanges = true;
                }
                else if (i >= changed.length) {
                    // Элемент удален
                    diff.push(null);
                    hasChanges = true;
                }
                else {
                    const itemDiff = this.diff(origItem, changedItem, `${path}[${i}]`);
                    if (itemDiff !== undefined) {
                        diff.push(itemDiff);
                        hasChanges = true;
                    }
                    else {
                        diff.push(undefined); // Нет изменений
                    }
                }
            }
            return hasChanges ? diff : undefined;
        }
        // Оба объекта
        // КРИТИЧНО: Проверяем, что это действительно объекты перед использованием оператора 'in'
        if (typeof original !== 'object' || original === null || Array.isArray(original)) {
            return changed; // original не является объектом
        }
        if (typeof changed !== 'object' || changed === null || Array.isArray(changed)) {
            return changed; // changed не является объектом
        }
        const diff = {};
        const allKeys = new Set([...Object.keys(original), ...Object.keys(changed)]);
        let hasChanges = false;
        for (const key of allKeys) {
            const origValue = original[key];
            const changedValue = changed[key];
            // Безопасная проверка наличия ключа в объекте
            if (!(key in original)) {
                // Новое поле
                diff[key] = changedValue;
                hasChanges = true;
            }
            else if (!(key in changed)) {
                // Поле удалено
                diff[key] = null;
                hasChanges = true;
            }
            else {
                const valueDiff = this.diff(origValue, changedValue, path ? `${path}.${key}` : key);
                if (valueDiff !== undefined) {
                    diff[key] = valueDiff;
                    hasChanges = true;
                }
            }
        }
        return hasChanges ? diff : undefined;
    }
    /**
     * Применяет изменения к оригинальной структуре, сохраняя неизмененные поля
     */
    static applyDiff(original, diff) {
        if (diff === undefined) {
            return original; // Нет изменений
        }
        if (diff === null) {
            return null; // Удалено
        }
        if (original === null || original === undefined) {
            return diff; // Новое значение
        }
        // Примитивы
        if (typeof diff !== 'object') {
            return diff;
        }
        // Массивы
        if (Array.isArray(diff)) {
            if (!Array.isArray(original)) {
                // Оригинал не был массивом — принимаем новую структуру целиком
                return diff;
            }
            const result = [];
            const maxLength = Math.max(original.length, diff.length);
            for (let i = 0; i < maxLength; i++) {
                const origItem = original[i];
                const diffItem = diff[i];
                if (i >= diff.length) {
                    // Элемент не изменился
                    if (i < original.length)
                        result.push((0, xmlStructureUtils_1.deepClone)(origItem));
                    continue;
                }
                if (diffItem === null) {
                    // Элемент удалён — пропускаем
                    continue;
                }
                if (diffItem === undefined) {
                    // Элемент не изменился
                    if (i < original.length)
                        result.push((0, xmlStructureUtils_1.deepClone)(origItem));
                    continue;
                }
                // Элемент изменился или новый
                result.push(this.applyDiff(origItem, diffItem));
            }
            return result;
        }
        // Объекты
        if (typeof original !== 'object' || original === null || Array.isArray(original)) {
            return diff; // original не является объектом
        }
        if (typeof diff !== 'object' || diff === null || Array.isArray(diff)) {
            return diff; // diff не является объектом
        }
        const result = {};
        // Сначала копируем все поля из оригинала
        for (const key in original) {
            if (key in diff) {
                const diffValue = diff[key];
                if (diffValue === null) {
                    // Поле удалено - пропускаем
                    continue;
                }
                else if (diffValue === undefined) {
                    // Поле не изменилось
                    result[key] = (0, xmlStructureUtils_1.deepClone)(original[key]);
                }
                else {
                    // Поле изменилось
                    result[key] = this.applyDiff(original[key], diffValue);
                }
            }
            else {
                // Поле не изменилось
                result[key] = (0, xmlStructureUtils_1.deepClone)(original[key]);
            }
        }
        // Добавляем новые поля
        for (const key in diff) {
            if (!(key in original)) {
                result[key] = (0, xmlStructureUtils_1.deepClone)(diff[key]);
            }
        }
        return result;
    }
    /**
     * Сливает изменения с оригинальной структурой
     * @param original Оригинальная XML структура
     * @param changed Измененная структура (из формы)
     * @returns Объединенная структура с сохранением неизмененных полей
     */
    static merge(original, changed) {
        if (!original) {
            return changed;
        }
        if (!changed) {
            return original;
        }
        // Вычисляем различия
        const diff = this.diff(original, changed);
        // Применяем различия к оригиналу
        return this.applyDiff(original, diff);
    }
    /**
     * Проверяет, есть ли изменения между двумя объектами
     */
    static hasChanges(original, changed) {
        const diff = this.diff(original, changed);
        return diff !== undefined;
    }
}
exports.XmlDiffMerge = XmlDiffMerge;
//# sourceMappingURL=xmlDiffMerge.js.map