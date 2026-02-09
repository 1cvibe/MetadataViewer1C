/**
 * Базовые JSON Schema для метаданных 1С
 * Содержит общие схемы для всех типов объектов
 */

import { JSONSchema7 } from 'json-schema';

/**
 * Схема для многоязычного поля (v8:item структура)
 */
export const multilingualFieldSchema: JSONSchema7 = {
  type: 'object',
  title: 'Многоязычное поле',
  properties: {
    'v8:item': {
      type: 'array',
      title: 'Элементы',
      items: {
        type: 'object',
        properties: {
          'v8:lang': {
            type: 'string',
            title: 'Язык',
            default: 'ru',
            enum: ['ru', 'en', 'uk', 'kz']
          },
          'v8:content': {
            type: 'string',
            title: 'Содержимое'
          }
        },
        required: ['v8:lang', 'v8:content']
      },
      default: [{ 'v8:lang': 'ru', 'v8:content': '' }]
    }
  }
};

/**
 * Схема для типа данных (Type)
 */
export const typeSchema: JSONSchema7 = {
  type: 'object',
  title: 'Тип данных',
  oneOf: [
    {
      title: 'Простой тип',
      properties: {
        'v8:Type': {
          type: 'string',
          title: 'Тип'
        }
      },
      required: ['v8:Type']
    },
    {
      title: 'Составной тип (OneOf)',
      properties: {
        OneOf: {
          type: 'object',
          title: 'Один из типов',
          properties: {
            Type: {
              type: 'array',
              title: 'Типы',
              items: {
                type: 'object',
                properties: {
                  'v8:Type': {
                    type: 'string',
                    title: 'Тип'
                  }
                }
              }
            }
          }
        }
      },
      required: ['OneOf']
    },
    {
      title: 'Набор типов (TypeSet)',
      properties: {
        'v8:TypeSet': {
          type: 'string',
          title: 'Набор типов'
        }
      },
      required: ['v8:TypeSet']
    }
  ]
};

/**
 * Схема для квалификаторов строки
 */
export const stringQualifiersSchema: JSONSchema7 = {
  type: 'object',
  title: 'Квалификаторы строки',
  properties: {
    'v8:Length': {
      type: 'number',
      title: 'Длина',
      minimum: 0,
      maximum: 1024,
      default: 10
    },
    'v8:AllowedLength': {
      type: 'string',
      title: 'Тип длины',
      enum: ['Fixed', 'Variable'],
      default: 'Variable'
    }
  }
};

/**
 * Схема для квалификаторов числа
 */
export const numberQualifiersSchema: JSONSchema7 = {
  type: 'object',
  title: 'Квалификаторы числа',
  properties: {
    'v8:Digits': {
      type: 'number',
      title: 'Разрядов',
      minimum: 1,
      maximum: 32,
      default: 10
    },
    'v8:FractionDigits': {
      type: 'number',
      title: 'Дробных разрядов',
      minimum: 0,
      maximum: 10,
      default: 2
    },
    'v8:Sign': {
      type: 'string',
      title: 'Знак',
      enum: ['Any', 'Nonnegative'],
      default: 'Any'
    }
  }
};

/**
 * Схема для квалификаторов даты
 */
export const dateQualifiersSchema: JSONSchema7 = {
  type: 'object',
  title: 'Квалификаторы даты',
  properties: {
    'v8:DateFractions': {
      type: 'string',
      title: 'Части даты',
      enum: ['Date', 'Time', 'DateTime'],
      default: 'DateTime'
    }
  }
};

/**
 * Базовые свойства, общие для всех объектов метаданных
 */
export const basePropertiesSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    Name: {
      type: 'string',
      title: 'Имя',
      description: 'Имя объекта метаданных'
    },
    Synonym: multilingualFieldSchema,
    Comment: {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Комментарий'
    },
    UseStandardCommands: {
      type: 'boolean',
      title: 'Использовать стандартные команды',
      default: true
    }
  },
  required: ['Name']
};

/**
 * Схема для стандартных атрибутов (StandardAttributes)
 */
export const standardAttributeSchema: JSONSchema7 = {
  type: 'object',
  title: 'Стандартный атрибут',
  properties: {
    name: {
      type: 'string',
      title: 'Имя атрибута',
      enum: ['Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 'Parent', 'Code', 'Description', 'Predefined', 'Level', 'IsFolder', 'DataVersion', 'LockedByDBMS', 'WriteMode', 'ReadOnly']
    },
    'xr:LinkByType': {
      type: 'string',
      title: 'Связь по типу'
    },
    'xr:FillChecking': {
      type: 'string',
      title: 'Проверка заполнения',
      enum: ['DontCheck', 'ShowError', 'ShowWarning'],
      default: 'DontCheck'
    },
    'xr:MultiLine': {
      type: 'boolean',
      title: 'Многострочный',
      default: false
    },
    'xr:FillFromFillingValue': {
      type: 'boolean',
      title: 'Заполнять из значения заполнения',
      default: false
    },
    'xr:CreateOnInput': {
      type: 'string',
      title: 'Создание при вводе',
      enum: ['Auto', 'DontCreate', 'Create'],
      default: 'Auto'
    },
    'xr:TypeReductionMode': {
      type: 'string',
      title: 'Режим приведения типа',
      enum: ['TransformValues', 'DontTransform'],
      default: 'TransformValues'
    },
    'xr:MaxValue': {
      oneOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'number' }
      ],
      title: 'Максимальное значение'
    },
    'xr:MinValue': {
      oneOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'number' }
      ],
      title: 'Минимальное значение'
    },
    'xr:ToolTip': {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Подсказка'
    },
    'xr:Synonym': {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Синоним'
    },
    'xr:Comment': {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Комментарий'
    },
    'xr:Format': {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Формат'
    },
    'xr:EditFormat': {
      oneOf: [
        { type: 'string' },
        multilingualFieldSchema
      ],
      title: 'Формат редактирования'
    },
    'xr:ExtendedEdit': {
      type: 'boolean',
      title: 'Расширенное редактирование',
      default: false
    },
    'xr:ChoiceForm': {
      type: 'string',
      title: 'Форма выбора'
    },
    'xr:QuickChoice': {
      type: 'string',
      title: 'Быстрый выбор',
      enum: ['Auto', 'DontUse', 'Use'],
      default: 'Auto'
    },
    'xr:ChoiceHistoryOnInput': {
      type: 'string',
      title: 'История выбора при вводе',
      enum: ['Auto', 'DontUse', 'Use'],
      default: 'Auto'
    },
    'xr:PasswordMode': {
      type: 'boolean',
      title: 'Режим пароля',
      default: false
    },
    'xr:DataHistory': {
      type: 'string',
      title: 'История данных',
      enum: ['DontUse', 'Use'],
      default: 'Use'
    },
    'xr:MarkNegatives': {
      type: 'boolean',
      title: 'Отмечать отрицательные',
      default: false
    },
    'xr:FullTextSearch': {
      type: 'string',
      title: 'Полнотекстовый поиск',
      enum: ['DontUse', 'Use'],
      default: 'Use'
    },
    'xr:ChoiceParameterLinks': {
      type: 'object',
      title: 'Связи параметров выбора'
    },
    'xr:FillValue': {
      oneOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'number' }
      ],
      title: 'Значение заполнения'
    },
    'xr:Mask': {
      type: 'string',
      title: 'Маска'
    },
    'xr:ChoiceParameters': {
      type: 'object',
      title: 'Параметры выбора'
    }
  },
  required: ['name']
};

/**
 * Схема для массива стандартных атрибутов
 */
export const standardAttributesSchema: JSONSchema7 = {
  type: 'array',
  title: 'Стандартные атрибуты',
  items: standardAttributeSchema
};

