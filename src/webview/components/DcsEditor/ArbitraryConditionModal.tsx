import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ArbitraryConditionModal.css';

type TreeNode = {
  id: string;
  label: string;
  insertText?: string;
  children?: TreeNode[];
};

export interface ArbitraryConditionModalProps {
  isOpen: boolean;
  initialValue: string;
  /** Список полей текущего регистра/источника (имена без префикса). */
  fields?: string[];
  onSave: (value: string) => void;
  onCancel: () => void;
}

function normalize(s: string): string {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function filterTree(root: TreeNode, q: string): TreeNode {
  const nq = normalize(q);
  if (!nq) return root;

  const walk = (n: TreeNode): TreeNode | null => {
    const selfMatch = normalize(n.label).includes(nq);
    const kids = (n.children || []).map(walk).filter(Boolean) as TreeNode[];
    if (selfMatch || kids.length) return { ...n, children: kids };
    return null;
  };

  return (walk(root) || { ...root, children: [] }) as TreeNode;
}

function makeFunctionsTree(): TreeNode {
  const leaf = (id: string, label: string, insertText: string): TreeNode => ({ id, label, insertText });

  return {
    id: 'root',
    label: 'Функции языка запросов',
    children: [
      {
        id: 'fn',
        label: 'Функции',
        children: [
          {
            id: 'fn-strings',
            label: 'Функции работы со строками',
            children: [
              leaf('fn-str-len', 'ДЛИНА', 'ДЛИНА('),
              leaf('fn-str-left', 'ЛЕВ', 'ЛЕВ('),
              leaf('fn-str-right', 'ПРАВ', 'ПРАВ('),
              leaf('fn-str-mid', 'СРЕД', 'СРЕД('),
            ],
          },
          {
            id: 'fn-dates',
            label: 'Функции работы с датами',
            children: [
              leaf('fn-date-begin', 'НАЧАЛОПЕРИОДА', 'НАЧАЛОПЕРИОДА('),
              leaf('fn-date-end', 'КОНЕЦПЕРИОДА', 'КОНЕЦПЕРИОДА('),
              leaf('fn-date-dt', 'ДАТАВРЕМЯ', 'ДАТАВРЕМЯ('),
            ],
          },
          {
            id: 'fn-numbers',
            label: 'Функции работы с числами',
            children: [
              leaf('fn-num-abs', 'ABS', 'ABS('),
              leaf('fn-num-round', 'ОКРУГЛ', 'ОКРУГЛ('),
            ],
          },
          {
            id: 'fn-agg',
            label: 'Агрегатные функции',
            children: [
              leaf('fn-agg-sum', 'СУММА', 'СУММА('),
              leaf('fn-agg-count', 'КОЛИЧЕСТВО', 'КОЛИЧЕСТВО('),
              leaf('fn-agg-avg', 'СРЕДНЕЕ', 'СРЕДНЕЕ('),
              leaf('fn-agg-min', 'МИНИМУМ', 'МИНИМУМ('),
              leaf('fn-agg-max', 'МАКСИМУМ', 'МАКСИМУМ('),
            ],
          },
          {
            id: 'fn-other',
            label: 'Прочие функции',
            children: [
              leaf('fn-other-null', 'ЕСТЬNULL', 'ЕСТЬNULL('),
              leaf('fn-other-value', 'ЗНАЧЕНИЕ', 'ЗНАЧЕНИЕ('),
              leaf('fn-other-type', 'ТИП', 'ТИП('),
            ],
          },
        ],
      },
      {
        id: 'ops',
        label: 'Операторы',
        children: [
          {
            id: 'ops-arith',
            label: 'Арифметические операторы',
            children: [
              leaf('op-plus', '+', ' + '),
              leaf('op-minus', '-', ' - '),
              leaf('op-mul', '*', ' * '),
              leaf('op-div', '/', ' / '),
            ],
          },
          {
            id: 'ops-log',
            label: 'Логические операторы',
            children: [
              leaf('op-and', 'И', ' И '),
              leaf('op-or', 'ИЛИ', ' ИЛИ '),
              leaf('op-not', 'НЕ', ' НЕ '),
            ],
          },
          {
            id: 'ops-other',
            label: 'Прочие операторы',
            children: [
              leaf('op-eq', '=', ' = '),
              leaf('op-ne', '<>', ' <> '),
              leaf('op-gt', '>', ' > '),
              leaf('op-lt', '<', ' < '),
              leaf('op-ge', '>=', ' >= '),
              leaf('op-le', '<=', ' <= '),
              leaf('op-in', 'В', ' В '),
              leaf('op-between', 'МЕЖДУ', ' МЕЖДУ '),
              leaf('op-isnull', 'ЕСТЬ NULL', ' ЕСТЬ NULL'),
            ],
          },
        ],
      },
      {
        id: 'misc',
        label: 'Прочее',
        children: [
          leaf('misc-true', 'ИСТИНА', 'ИСТИНА'),
          leaf('misc-false', 'ЛОЖЬ', 'ЛОЖЬ'),
          leaf('misc-null', 'NULL', 'NULL'),
        ],
      },
    ],
  };
}

function makeFieldsTree(fields: string[]): TreeNode {
  const children = (fields || []).filter(Boolean).map((f) => ({ id: `field/${f}`, label: f, insertText: f }));
  return { id: 'fields', label: 'Поля', children };
}

export const ArbitraryConditionModal: React.FC<ArbitraryConditionModalProps> = ({
  isOpen,
  initialValue,
  fields,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [fieldsQuery, setFieldsQuery] = useState('');
  const [funcQuery, setFuncQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    fields: true,
    root: true,
    fn: true,
    ops: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    setValue(initialValue || '');
    setFieldsQuery('');
    setFuncQuery('');
    setExpanded({ fields: true, root: true, fn: true, ops: true });

    // фокус и позиция курсора
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value?.length || 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 0);
  }, [isOpen, initialValue]);

  const insertIntoText = (insertText: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((prev) => prev + insertText);
      return;
    }

    const src = String(value || '');
    const start = el.selectionStart ?? src.length;
    const end = el.selectionEnd ?? src.length;

    const before = src.slice(0, start);
    const after = src.slice(end);

    const next = before + insertText + after;
    setValue(next);

    // восстановим курсор после вставки
    setTimeout(() => {
      el.focus();
      const pos = start + insertText.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const fieldsTree = useMemo(() => makeFieldsTree(fields || []), [fields]);
  const functionsTree = useMemo(() => makeFunctionsTree(), []);

  const filteredFields = useMemo(() => filterTree(fieldsTree, fieldsQuery), [fieldsTree, fieldsQuery]);
  const filteredFunctions = useMemo(() => filterTree(functionsTree, funcQuery), [functionsTree, funcQuery]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const renderNode = (n: TreeNode, depth: number) => {
    const hasChildren = Array.isArray(n.children) && n.children.length > 0;
    const isOpenNode = !!expanded[n.id];
    const isLeaf = !hasChildren;

    return (
      <div key={n.id} className="cond-tree__node" style={{ paddingLeft: 8 + depth * 14 }}>
        <div className="cond-tree__row">
          {hasChildren ? (
            <button
              type="button"
              className="cond-tree__toggle"
              onClick={() => toggle(n.id)}
              title={isOpenNode ? 'Свернуть' : 'Развернуть'}
            >
              {isOpenNode ? '▾' : '▸'}
            </button>
          ) : (
            <span className="cond-tree__spacer" />
          )}

          <div
            className={`cond-tree__label ${n.insertText ? 'is-insertable' : ''}`}
            title={n.insertText ? `Вставить: ${n.insertText}` : n.label}
            onDoubleClick={() => {
              if (!n.insertText) return;
              insertIntoText(n.insertText);
            }}
            onClick={() => {
              if (!isLeaf || !n.insertText) return;
              insertIntoText(n.insertText);
            }}
          >
            {n.label}
          </div>
        </div>

        {hasChildren && isOpenNode ? (
          <div className="cond-tree__children">{n.children!.map((c) => renderNode(c, depth + 1))}</div>
        ) : null}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="cond-modal__overlay" onClick={onCancel}>
      <div className="cond-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cond-modal__header">
          <div className="cond-modal__title">Произвольное условие</div>
          <button className="cond-modal__close" type="button" onClick={onCancel} title="Закрыть">
            ✕
          </button>
        </div>

        <div className="cond-modal__body">
          <div className="cond-modal__top">
            <div className="cond-modal__panel">
              <div className="cond-modal__panel-title">Поля</div>
              <input
                className="cond-modal__search"
                value={fieldsQuery}
                onChange={(e) => setFieldsQuery(e.target.value)}
                placeholder="Поиск полей…"
              />
              <div className="cond-modal__tree">{renderNode(filteredFields, 0)}</div>
            </div>

            <div className="cond-modal__panel">
              <div className="cond-modal__panel-title">Функции языка запросов</div>
              <input
                className="cond-modal__search"
                value={funcQuery}
                onChange={(e) => setFuncQuery(e.target.value)}
                placeholder="Поиск функций…"
              />
              <div className="cond-modal__tree">{renderNode(filteredFunctions, 0)}</div>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="cond-modal__textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            placeholder="Введите условие..."
          />
        </div>

        <div className="cond-modal__footer">
          <button type="button" className="cond-modal__btn" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="cond-modal__btn cond-modal__btn--primary" onClick={() => onSave(value)}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
