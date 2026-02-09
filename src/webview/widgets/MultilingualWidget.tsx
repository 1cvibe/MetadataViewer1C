/**
 * Кастомный виджет для редактирования многоязычных полей
 */

import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';

export const MultilingualWidget: React.FC<WidgetProps> = (props) => {
  const { value, onChange } = props;
  
  // Нормализуем значение: может быть строкой или объектом с v8:item
  const normalizeValue = (val: any): Array<{ lang: string; content: string }> => {
    if (!val) return [{ lang: 'ru', content: '' }];
    
    if (typeof val === 'string') {
      return [{ lang: 'ru', content: val }];
    }
    
    if (val['v8:item']) {
      const items = Array.isArray(val['v8:item']) ? val['v8:item'] : [val['v8:item']];
      return items.map((item: any) => ({
        lang: item['v8:lang'] || 'ru',
        content: item['v8:content'] || ''
      }));
    }
    
    return [{ lang: 'ru', content: '' }];
  };

  const [items, setItems] = useState(normalizeValue(value));

  const handleItemChange = (index: number, field: 'lang' | 'content', newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newValue };
    setItems(newItems);
    
    // Преобразуем обратно в формат v8:item
    const v8Item = newItems.map(item => ({
      'v8:lang': item.lang,
      'v8:content': item.content
    }));
    
    onChange({
      'v8:item': v8Item.length === 1 ? v8Item[0] : v8Item
    });
  };

  const addItem = () => {
    setItems([...items, { lang: 'ru', content: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      
      const v8Item = newItems.map(item => ({
        'v8:lang': item.lang,
        'v8:content': item.content
      }));
      
      onChange({
        'v8:item': v8Item.length === 1 ? v8Item[0] : v8Item
      });
    }
  };

  return (
    <div className="multilingual-widget">
      {items.map((item, index) => (
        <div key={index} className="multilingual-item">
          <select
            value={item.lang}
            onChange={(e) => handleItemChange(index, 'lang', e.target.value)}
            className="multilingual-lang"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
            <option value="kz">Қазақ</option>
          </select>
          <input
            type="text"
            value={item.content}
            onChange={(e) => handleItemChange(index, 'content', e.target.value)}
            className="multilingual-content"
            placeholder="Введите значение..."
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="multilingual-remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="multilingual-add"
      >
        + Добавить язык
      </button>
    </div>
  );
};

