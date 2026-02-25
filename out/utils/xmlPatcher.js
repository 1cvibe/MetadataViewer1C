"use strict";
/**
 * Утилита для применения патчей к XML структуре
 * Используется для сложных изменений, которые требуют прямого редактирования XML
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlPatcher = void 0;
class XmlPatcher {
    /**
     * Получает значение по пути (например, "Properties.Name" или "attributes[0].Type")
     */
    static getValueByPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (part.includes('[') && part.includes(']')) {
                // Массив: "attributes[0]"
                const [key, indexStr] = part.split('[');
                const index = parseInt(indexStr.replace(']', ''), 10);
                if (current && current[key] && Array.isArray(current[key])) {
                    current = current[key][index];
                }
                else {
                    return undefined;
                }
            }
            else {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                }
                else {
                    return undefined;
                }
            }
        }
        return current;
    }
    /**
     * Устанавливает значение по пути
     */
    static setValueByPath(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (part.includes('[') && part.includes(']')) {
                // Массив: "attributes[0]"
                const [key, indexStr] = part.split('[');
                const index = parseInt(indexStr.replace(']', ''), 10);
                if (!current[key]) {
                    current[key] = [];
                }
                if (!Array.isArray(current[key])) {
                    current[key] = [current[key]];
                }
                if (!current[key][index]) {
                    current[key][index] = {};
                }
                current = current[key][index];
            }
            else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('[') && lastPart.includes(']')) {
            const [key, indexStr] = lastPart.split('[');
            const index = parseInt(indexStr.replace(']', ''), 10);
            if (!current[key]) {
                current[key] = [];
            }
            if (!Array.isArray(current[key])) {
                current[key] = [current[key]];
            }
            current[key][index] = value;
        }
        else {
            current[lastPart] = value;
        }
    }
    /**
     * Удаляет значение по пути
     */
    static removeValueByPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (part.includes('[') && part.includes(']')) {
                const [key, indexStr] = part.split('[');
                const index = parseInt(indexStr.replace(']', ''), 10);
                if (current && current[key] && Array.isArray(current[key])) {
                    current = current[key][index];
                }
                else {
                    return; // Путь не существует
                }
            }
            else {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                }
                else {
                    return; // Путь не существует
                }
            }
        }
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('[') && lastPart.includes(']')) {
            const [key, indexStr] = lastPart.split('[');
            const index = parseInt(indexStr.replace(']', ''), 10);
            if (current && current[key] && Array.isArray(current[key])) {
                current[key].splice(index, 1);
            }
        }
        else {
            if (current && typeof current === 'object') {
                delete current[lastPart];
            }
        }
    }
    /**
     * Применяет патч к объекту
     */
    static applyPatch(obj, patch) {
        const result = JSON.parse(JSON.stringify(obj)); // Глубокое копирование
        switch (patch.op) {
            case 'set':
                this.setValueByPath(result, patch.path, patch.value);
                break;
            case 'add':
                const parentPath = patch.path.split('.').slice(0, -1).join('.');
                const parent = this.getValueByPath(result, parentPath);
                if (Array.isArray(parent)) {
                    parent.push(patch.value);
                }
                else {
                    this.setValueByPath(result, patch.path, patch.value);
                }
                break;
            case 'remove':
                this.removeValueByPath(result, patch.path);
                break;
        }
        return result;
    }
    /**
     * Применяет массив патчей к объекту
     */
    static applyPatches(obj, patches) {
        let result = obj;
        for (const patch of patches) {
            result = this.applyPatch(result, patch);
        }
        return result;
    }
    /**
     * Валидирует патч перед применением
     */
    static validatePatch(obj, patch) {
        try {
            switch (patch.op) {
                case 'set':
                case 'add':
                    // Проверяем, что путь валиден (для set)
                    if (patch.op === 'set') {
                        const parentPath = patch.path.split('.').slice(0, -1).join('.');
                        const parent = this.getValueByPath(obj, parentPath);
                        if (parent === undefined && parentPath !== '') {
                            return false; // Родительский путь не существует
                        }
                    }
                    return true;
                case 'remove':
                    // Проверяем, что путь существует
                    const value = this.getValueByPath(obj, patch.path);
                    return value !== undefined;
                default:
                    return false;
            }
        }
        catch (e) {
            return false;
        }
    }
}
exports.XmlPatcher = XmlPatcher;
//# sourceMappingURL=xmlPatcher.js.map