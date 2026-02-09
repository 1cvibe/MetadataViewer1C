/**
 * Редактор предопределенных элементов
 * Использует карточки для отображения элементов и TypeWidget для редактирования типов
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PredefinedDataItem } from '../../../predefinedDataInterfaces';
import { PredefinedTypeEditorModal } from './PredefinedTypeEditorModal';
import { AccountingFlagsTable } from './AccountingFlagsTable';
import { ExtDimensionTypesTable } from './ExtDimensionTypesTable';
import { AccountingFlagsView } from './AccountingFlagsView';
import { ExtDimensionTypesView } from './ExtDimensionTypesView';
import '../../styles/editor.css';
import './PredefinedEditorApp.css';

interface PredefinedEditorAppProps {
  vscode: any;
}

interface ChartOfAccountsData {
  accountingFlags: string[];
  extDimensionAccountingFlags: string[];
  dimensionTypes: Array<{
    name: string;
    chartOfCharacteristicTypesName: string;
    predefinedItems: string[];
  }>;
}

interface InitMessage {
  type: 'init';
  payload: PredefinedDataItem[];
  objectType?: string;
  metadata?: {
    registers: string[];
    referenceTypes: string[];
  };
  chartOfAccountsData?: ChartOfAccountsData;
}

export const PredefinedEditorApp: React.FC<PredefinedEditorAppProps> = ({ vscode }) => {
  const [items, setItems] = useState<PredefinedDataItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<PredefinedDataItem | null>(null);
  const [editingChild, setEditingChild] = useState<{ path: number[] } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleteChild, setDeleteChild] = useState<{ path: number[] } | null>(null);
  const [objectType, setObjectType] = useState<string>('');
  const [metadata, setMetadata] = useState<{ registers: string[]; referenceTypes: string[] }>({
    registers: [],
    referenceTypes: []
  });
  const [chartOfAccountsData, setChartOfAccountsData] = useState<ChartOfAccountsData | undefined>(undefined);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeModalContext, setTypeModalContext] = useState<{ mode: 'add' | 'edit'; currentType: string }>({ 
    mode: 'add', 
    currentType: '' 
  });
  const [newItem, setNewItem] = useState<Partial<PredefinedDataItem>>({
    Name: '',
    Code: '',
    Description: '',
    Type: '',
    IsFolder: false
  });

  // Проверка, является ли объект планом видов характеристик
  const isChartOfCharacteristicTypes = useMemo(() => {
    return objectType === 'ChartOfCharacteristicTypes' || 
           objectType === 'План видов характеристик' ||
           objectType.includes('ChartOfCharacteristicTypes');
  }, [objectType]);

  // Проверка, является ли объект планом счетов
  const isChartOfAccounts = useMemo(() => {
    return objectType === 'ChartOfAccounts' || 
           objectType === 'План счетов' ||
           objectType.includes('ChartOfAccounts');
  }, [objectType]);

  // Обработка сообщений от extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[PredefinedEditorApp] Получено сообщение:', message.type, 'элементов:', message.payload?.length || 0);
      
      if (message.type === 'init') {
        const initMsg = message as InitMessage;
        console.log('[PredefinedEditorApp] Инициализация с данными:', initMsg.payload);
        setItems(initMsg.payload || []);
        if (initMsg.objectType) {
          setObjectType(initMsg.objectType);
        }
        if (initMsg.metadata) {
          setMetadata(initMsg.metadata);
        }
        if (initMsg.chartOfAccountsData) {
          console.log('[PredefinedEditorApp] Получены данные плана счетов:', {
            accountingFlags: initMsg.chartOfAccountsData.accountingFlags?.length || 0,
            extDimensionAccountingFlags: initMsg.chartOfAccountsData.extDimensionAccountingFlags?.length || 0,
            dimensionTypes: initMsg.chartOfAccountsData.dimensionTypes?.length || 0
          });
          if (initMsg.chartOfAccountsData.dimensionTypes && initMsg.chartOfAccountsData.dimensionTypes.length > 0) {
            console.log('[PredefinedEditorApp] Виды субконто:', initMsg.chartOfAccountsData.dimensionTypes.map(dt => ({
              name: dt.name,
              chartOfCharacteristicTypesName: dt.chartOfCharacteristicTypesName,
              predefinedItemsCount: dt.predefinedItems?.length || 0
            })));
          }
          setChartOfAccountsData(initMsg.chartOfAccountsData);
        } else {
          console.warn('[PredefinedEditorApp] Данные плана счетов не получены');
        }
      } else if (message.type === 'saved') {
        if (message.payload?.success) {
          setEditingIndex(null);
          setEditingItem(null);
          setShowAddModal(false);
          setShowTypeModal(false);
          setShowDeleteConfirm(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    // Запрашиваем данные при загрузке
    console.log('[PredefinedEditorApp] Компонент загружен, запрашиваем данные');
    vscode.postMessage({ type: 'requestData' });
    
    // Отправляем сообщение о готовности
    requestAnimationFrame(() => {
      setTimeout(() => {
        vscode.postMessage({ type: 'webviewReady' });
      }, 50);
    });
    
    return () => window.removeEventListener('message', handleMessage);
  }, [vscode]);

  const handleSave = () => {
    vscode.postMessage({ type: 'save', payload: items });
  };

  const handleAdd = () => {
    if (!newItem.Name || !newItem.Code) {
      alert('Заполните обязательные поля: Имя и Код');
      return;
    }
    // Убираем Type если это не план видов характеристик
    // Убираем поля плана счетов если это не план счетов
    const itemToAdd: PredefinedDataItem = {
      Name: newItem.Name,
      Code: newItem.Code,
      Description: newItem.Description || '',
      Type: isChartOfCharacteristicTypes ? (newItem.Type || '') : '',
      IsFolder: newItem.IsFolder || false,
      // Поля плана счетов
      AccountType: isChartOfAccounts ? newItem.AccountType : undefined,
      OffBalance: isChartOfAccounts ? newItem.OffBalance : undefined,
      Order: isChartOfAccounts ? newItem.Order : undefined,
      AccountingFlags: isChartOfAccounts && newItem.AccountingFlags ? newItem.AccountingFlags : undefined,
      ExtDimensionTypes: isChartOfAccounts && newItem.ExtDimensionTypes ? newItem.ExtDimensionTypes : undefined
    };
    const updatedItems = [...items, itemToAdd];
    setItems(updatedItems);
    vscode.postMessage({ type: 'addItem', payload: itemToAdd });
    setNewItem({ Name: '', Code: '', Description: '', Type: '', IsFolder: false });
    setShowAddModal(false);
  };

  /** Получить элемент по пути [rootIndex, childIndex1, childIndex2, ...] */
  const getItemByPath = (itemsList: PredefinedDataItem[], path: number[]): PredefinedDataItem | null => {
    if (path.length === 0) return null;
    let current: PredefinedDataItem | undefined = itemsList[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (!current?.ChildItems?.Item) return null;
      current = current.ChildItems.Item[path[i]];
    }
    return current ?? null;
  };

  /** Обновить вложенный элемент по относительному пути (path без rootIndex) */
  const updateItemAtPath = (
    item: PredefinedDataItem,
    relPath: number[],
    newValue: PredefinedDataItem
  ): PredefinedDataItem | null => {
    if (relPath.length === 0) return newValue;
    const [first, ...rest] = relPath;
    if (!item.ChildItems?.Item || first >= item.ChildItems.Item.length) return null;
    const updatedChildren = [...item.ChildItems.Item];
    const updatedChild = updateItemAtPath(updatedChildren[first], rest, newValue);
    if (!updatedChild) return null;
    updatedChildren[first] = updatedChild;
    return { ...item, ChildItems: { Item: updatedChildren } };
  };

  /** Удалить вложенный элемент по относительному пути */
  const removeItemAtPath = (
    item: PredefinedDataItem,
    relPath: number[]
  ): PredefinedDataItem | null => {
    if (relPath.length === 0) return null;
    if (relPath.length === 1) {
      const idx = relPath[0];
      if (!item.ChildItems?.Item || idx >= item.ChildItems.Item.length) return null;
      const updatedChildren = item.ChildItems.Item.filter((_, i) => i !== idx);
      if (updatedChildren.length === 0) {
        const { ChildItems, ...rest } = item;
        return rest as PredefinedDataItem;
      }
      return { ...item, ChildItems: { Item: updatedChildren } };
    }
    const [first, ...rest] = relPath;
    if (!item.ChildItems?.Item || first >= item.ChildItems.Item.length) return null;
    const updatedChildren = [...item.ChildItems.Item];
    const updatedChild = removeItemAtPath(updatedChildren[first], rest);
    if (updatedChild === null) return null;
    updatedChildren[first] = updatedChild;
    return { ...item, ChildItems: { Item: updatedChildren } };
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
    setEditingChild(null);
  };

  const handleEditChild = (path: number[]) => {
    if (path.length < 2) return;
    const childItem = getItemByPath(items, path);
    if (!childItem) return;
    const copiedItem: PredefinedDataItem = {
      ...childItem,
      AccountingFlags: childItem.AccountingFlags && childItem.AccountingFlags.length > 0
        ? childItem.AccountingFlags.map(flag => ({
            flagName: flag.flagName,
            enabled: flag.enabled,
            ref: flag.ref
          }))
        : childItem.AccountingFlags,
      ExtDimensionTypes: childItem.ExtDimensionTypes && childItem.ExtDimensionTypes.length > 0
        ? childItem.ExtDimensionTypes.map(dimType => {
            const copiedFlags: Record<string, boolean | { enabled: boolean; ref?: string }> = {};
            if (dimType.flags) {
              Object.entries(dimType.flags).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                  copiedFlags[key] = value;
                } else if (value && typeof value === 'object' && 'enabled' in value) {
                  copiedFlags[key] = { enabled: value.enabled, ref: value.ref };
                }
              });
            }
            return {
              dimensionType: dimType.dimensionType,
              turnoverOnly: dimType.turnoverOnly,
              flags: copiedFlags,
              name: dimType.name
            };
          })
        : childItem.ExtDimensionTypes
    };
    setEditingChild({ path });
    setEditingItem(copiedItem);
    setEditingIndex(null);
  };

  const handleUpdate = (updatedItem: PredefinedDataItem) => {
    if (!updatedItem.Name || !updatedItem.Code) {
      alert('Заполните обязательные поля: Имя и Код');
      return;
    }
    // Убираем Type если это не план видов характеристик
    if (!isChartOfCharacteristicTypes) {
      updatedItem.Type = '';
    }
    // Убираем поля плана счетов если это не план счетов
    if (!isChartOfAccounts) {
      updatedItem.AccountType = undefined;
      updatedItem.OffBalance = undefined;
      updatedItem.Order = undefined;
      updatedItem.AccountingFlags = undefined;
      updatedItem.ExtDimensionTypes = undefined;
    }
    
    if (editingChild && editingChild.path.length >= 2) {
      // Обновление вложенного элемента по пути
      const path = editingChild.path;
      const rootIndex = path[0];
      const updatedChildItem: PredefinedDataItem = {
        ...updatedItem,
        AccountingFlags: updatedItem.AccountingFlags
          ? updatedItem.AccountingFlags.map(flag => ({ ...flag }))
          : undefined,
        ExtDimensionTypes: updatedItem.ExtDimensionTypes
          ? updatedItem.ExtDimensionTypes.map(dimType => ({
              ...dimType,
              flags: dimType.flags ? { ...dimType.flags } : {}
            }))
          : undefined
      };
      const updatedRootItem = updateItemAtPath(items[rootIndex], path.slice(1), updatedChildItem);
      if (updatedRootItem) {
        const updatedItems = [...items];
        updatedItems[rootIndex] = updatedRootItem;
        setItems(updatedItems);
        vscode.postMessage({
          type: 'updateItem',
          payload: { index: rootIndex, item: updatedRootItem }
        });
      }
      setEditingChild(null);
    } else {
      // Обновление обычного элемента
      const updatedItems = [...items];
      updatedItems[editingIndex!] = updatedItem;
      setItems(updatedItems);
      vscode.postMessage({ type: 'updateItem', payload: { index: editingIndex!, item: updatedItem } });
      setEditingIndex(null);
    }
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
    setEditingChild(null);
  };

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
    setDeleteChild(null);
    setShowDeleteConfirm(true);
  };

  const handleDeleteChild = (path: number[]) => {
    if (path.length < 2) return;
    setDeleteChild({ path });
    setDeleteIndex(null);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteChild && deleteChild.path.length >= 2) {
      const path = deleteChild.path;
      const rootIndex = path[0];
      const relPath = path.slice(1);
      const updatedRootItem = removeItemAtPath(items[rootIndex], relPath);
      if (updatedRootItem !== null) {
        const updatedItems = [...items];
        updatedItems[rootIndex] = updatedRootItem;
        setItems(updatedItems);
        vscode.postMessage({
          type: 'updateItem',
          payload: { index: rootIndex, item: updatedRootItem }
        });
      }
      setDeleteChild(null);
    } else if (deleteIndex !== null) {
      // Удаление обычного элемента
      const updatedItems = items.filter((_, i) => i !== deleteIndex);
      setItems(updatedItems);
      vscode.postMessage({ type: 'deleteItem', payload: { index: deleteIndex } });
      setDeleteIndex(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
    setDeleteChild(null);
  };

  const handleOpenTypeModal = (mode: 'add' | 'edit', currentType: string = '') => {
    setTypeModalContext({ mode, currentType });
    setShowTypeModal(true);
  };

  const handleTypeSave = (selectedType: string) => {
    if (typeModalContext.mode === 'add') {
      setNewItem({ ...newItem, Type: selectedType });
    } else if (typeModalContext.mode === 'edit' && editingItem) {
      setEditingItem({ ...editingItem, Type: selectedType });
    }
    setShowTypeModal(false);
  };

  return (
    <div className="predefined-editor-wrapper">
      <div className="predefined-editor">
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>Предопределенные элементы</h2>
          <span style={{ fontSize: '13px', color: 'var(--vscode-descriptionForeground)' }}>
            Элементы ({items.length})
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-add" onClick={() => setShowAddModal(true)}>Добавить</button>
          <button className="btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>

      <div className="editor-content">
        {showAddModal && (
          <div className="modal-overlay" onClick={() => { 
            setShowAddModal(false); 
            setNewItem({ 
              Name: '', 
              Code: '', 
              Description: '', 
              Type: '', 
              IsFolder: false,
              AccountType: undefined,
              OffBalance: undefined,
              Order: undefined,
              AccountingFlags: undefined,
              ExtDimensionTypes: undefined
            }); 
          }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Добавить элемент</h3>
              <div className="modal-content">
                <label>
                  Имя: *
                  <input 
                    type="text" 
                    value={newItem.Name || ''} 
                    onChange={(e) => setNewItem({...newItem, Name: e.target.value})} 
                  />
                </label>
                <label>
                  Код: *
                  <input 
                    type="text" 
                    value={newItem.Code || ''} 
                    onChange={(e) => setNewItem({...newItem, Code: e.target.value})} 
                  />
                </label>
                <label>
                  Наименование:
                  <input 
                    type="text" 
                    value={newItem.Description || ''} 
                    onChange={(e) => setNewItem({...newItem, Description: e.target.value})} 
                  />
                </label>
                {isChartOfCharacteristicTypes && (
                  <label>
                    Тип:
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={newItem.Type || ''} 
                        readOnly
                        placeholder="Нажмите кнопку для выбора типа"
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button"
                        onClick={() => handleOpenTypeModal('add', newItem.Type || '')}
                        title="Открыть редактор типов"
                        aria-label="Открыть редактор типов"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--vscode-button-secondaryBackground)',
                          color: 'var(--vscode-button-secondaryForeground)',
                          border: '1px solid var(--vscode-button-border)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Выбрать тип
                      </button>
                    </div>
                  </label>
                )}
                {isChartOfAccounts && (
                  <>
                    <label>
                      Вид:
                      <select
                        value={newItem.AccountType || ''}
                        onChange={(e) => setNewItem({...newItem, AccountType: e.target.value as 'Active' | 'Passive' | 'ActivePassive' | undefined})}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          border: '1px solid var(--vscode-input-border)',
                          background: 'var(--vscode-input-background)',
                          color: 'var(--vscode-input-foreground)',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        <option value="">Не указан</option>
                        <option value="Active">Активный</option>
                        <option value="Passive">Пассивный</option>
                        <option value="ActivePassive">Активно-Пассивный</option>
                      </select>
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={newItem.OffBalance || false} 
                        onChange={(e) => setNewItem({...newItem, OffBalance: e.target.checked})} 
                      />
                      Забалансовый
                    </label>
                    <label>
                      Порядок:
                      <input 
                        type="text" 
                        value={newItem.Order || ''} 
                        onChange={(e) => setNewItem({...newItem, Order: e.target.value})} 
                        placeholder="Порядок"
                      />
                    </label>
                    {chartOfAccountsData && (
                      <>
                        <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                          Признаки учета:
                        </div>
                        <AccountingFlagsTable
                          accountingFlags={chartOfAccountsData.accountingFlags}
                          item={newItem as PredefinedDataItem}
                          onChange={(item) => setNewItem(item)}
                        />
                        <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                          Виды субконто:
                        </div>
                        <ExtDimensionTypesTable
                          dimensionTypes={chartOfAccountsData.dimensionTypes}
                          extDimensionAccountingFlags={chartOfAccountsData.extDimensionAccountingFlags}
                          item={newItem as PredefinedDataItem}
                          onChange={(item) => setNewItem(item)}
                        />
                      </>
                    )}
                  </>
                )}
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newItem.IsFolder || false} 
                    onChange={(e) => setNewItem({...newItem, IsFolder: e.target.checked})} 
                  />
                  Папка
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn-primary" onClick={handleAdd}>Добавить</button>
                <button 
                  className="btn-secondary" 
                  onClick={() => { 
                    setShowAddModal(false); 
                    setNewItem({ 
                      Name: '', 
                      Code: '', 
                      Description: '', 
                      Type: '', 
                      IsFolder: false,
                      AccountType: undefined,
                      OffBalance: undefined,
                      Order: undefined,
                      AccountingFlags: undefined,
                      ExtDimensionTypes: undefined
                    }); 
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-state">
            Для данного объекта предопределенные элементы не созданы
          </div>
        ) : (
          <div className="attributes-list">
            {items.map((item, index) => {
              const itemKey = item.id ? item.id : `${item.Code}-${item.Name}-${index}`;
              return editingIndex === index ? (
                <EditItemCard 
                  key={itemKey} 
                  item={editingItem} 
                  index={index}
                  parentPath={[index]}
                  isChartOfCharacteristicTypes={isChartOfCharacteristicTypes}
                  isChartOfAccounts={isChartOfAccounts}
                  chartOfAccountsData={chartOfAccountsData}
                  onSave={handleUpdate} 
                  onCancel={handleCancelEdit}
                  onChange={setEditingItem}
                  onOpenTypeModal={handleOpenTypeModal}
                  onEditChild={handleEditChild}
                  onDeleteChild={handleDeleteChild}
                  editingChild={editingChild}
                  editingItem={editingItem}
                />
              ) : (
                <PredefinedItemCard
                  key={itemKey}
                  item={item}
                  index={index}
                  isChartOfAccounts={isChartOfAccounts}
                  isChartOfCharacteristicTypes={isChartOfCharacteristicTypes}
                  chartOfAccountsData={chartOfAccountsData}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onEditChild={handleEditChild}
                  onDeleteChild={handleDeleteChild}
                  editingChild={editingChild}
                  editingItem={editingItem}
                  onSave={handleUpdate}
                  onCancel={handleCancelEdit}
                  onChange={setEditingItem}
                  onOpenTypeModal={handleOpenTypeModal}
                />
              );
            })}
          </div>
        )}

        {showTypeModal && (
          <PredefinedTypeEditorModal
            isOpen={showTypeModal}
            typeValue={typeModalContext.currentType || null}
            metadata={metadata}
            onClose={() => setShowTypeModal(false)}
            onSave={handleTypeSave}
          />
        )}

        {editingChild && editingItem && (
          <div className="modal-overlay" onClick={handleCancelEdit}>
            <div 
              className="modal edit-item-modal" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}
            >
              <h3 style={{ marginBottom: '16px' }}>
                Редактирование: {editingItem.Name || 'Элемент'}
              </h3>
              <EditItemCard
                item={editingItem}
                parentPath={editingChild.path}
                isChartOfCharacteristicTypes={isChartOfCharacteristicTypes}
                isChartOfAccounts={isChartOfAccounts}
                chartOfAccountsData={chartOfAccountsData}
                onSave={handleUpdate}
                onCancel={handleCancelEdit}
                onChange={setEditingItem}
                onOpenTypeModal={handleOpenTypeModal}
                onEditChild={handleEditChild}
                onDeleteChild={handleDeleteChild}
                editingChild={editingChild}
                editingItem={editingItem}
                showInModal
              />
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={handleCancelDelete}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <h3>Подтверждение удаления</h3>
              <div className="modal-content">
                <p>Вы уверены, что хотите удалить этот элемент?</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-primary" 
                  onClick={handleConfirmDelete} 
                  style={{ background: 'var(--vscode-errorForeground)' }}
                >
                  Удалить
                </button>
                <button className="btn-secondary" onClick={handleCancelDelete}>Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

interface PredefinedItemCardProps {
  item: PredefinedDataItem;
  index: number;
  parentPath?: number[];
  isChartOfAccounts: boolean;
  isChartOfCharacteristicTypes: boolean;
  chartOfAccountsData?: ChartOfAccountsData;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onEditChild?: (path: number[]) => void;
  onDeleteChild?: (path: number[]) => void;
  editingChild?: { path: number[] } | null;
  editingItem?: PredefinedDataItem | null;
  onSave?: (item: PredefinedDataItem) => void;
  onCancel?: () => void;
  onChange?: (item: PredefinedDataItem) => void;
  onOpenTypeModal?: (mode: 'add' | 'edit', currentType?: string) => void;
  isBeingEdited?: boolean;
}

const PredefinedItemCard: React.FC<PredefinedItemCardProps> = ({
  item,
  index,
  parentPath,
  isChartOfAccounts,
  isChartOfCharacteristicTypes,
  chartOfAccountsData,
  onEdit,
  onDelete,
  onEditChild,
  onDeleteChild,
  editingChild,
  editingItem,
  onSave,
  onCancel,
  onChange,
  onOpenTypeModal,
  isBeingEdited = false
}) => {
  const childPath = parentPath !== undefined ? [...parentPath, index] : [index];
  const isChildCard = parentPath !== undefined;
  return (
    <div 
      className="attribute-card" 
      style={isBeingEdited ? { border: '2px solid var(--vscode-focusBorder)', boxShadow: '0 0 0 1px var(--vscode-focusBorder)' } : undefined}
    >
      <div className="attribute-header">
        <h4>
          <span style={{ marginRight: '8px' }}>{item.IsFolder ? '📁' : '📄'}</span>
          {item.Name}
        </h4>
        {(index >= 0 || isChildCard) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-edit-type"
              type="button"
              onClick={() => {
                if (isChildCard && onEditChild && childPath.length >= 2) {
                  onEditChild(childPath);
                } else if (!isChildCard) {
                  onEdit(index);
                }
              }}
              title="Редактировать"
              aria-label="Редактировать"
              style={{ 
                padding: '4px 8px', 
                fontSize: '16px',
                background: 'var(--vscode-button-secondaryBackground)',
                color: 'var(--vscode-button-secondaryForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '3px',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              ✎
            </button>
            <button
              className="btn-edit-type"
              type="button"
              onClick={() => {
                if (isChildCard && onDeleteChild && childPath.length >= 2) {
                  onDeleteChild(childPath);
                } else if (!isChildCard) {
                  onDelete(index);
                }
              }}
              title="Удалить"
              aria-label="Удалить"
              style={{
                padding: '4px 8px',
                fontSize: '16px',
                background: 'var(--vscode-errorForeground)',
                color: 'var(--vscode-button-foreground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '3px',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="attribute-properties">
        <div className="property-row">
          <span className="property-name">Код:</span>
          <span className="property-value">{item.Code}</span>
        </div>
        {item.Description && (
          <div className="property-row">
            <span className="property-name">Наименование:</span>
            <span className="property-value">{item.Description}</span>
          </div>
        )}
        {isChartOfCharacteristicTypes && item.Type && (
          <div className="property-row">
            <span className="property-name">Тип:</span>
            <span className="property-value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              {item.Type.includes('|') 
                ? item.Type.split('|').map((t, idx) => (
                    <span key={idx}>
                      {t.trim()}
                      {idx < item.Type!.split('|').length - 1 && <span style={{ color: 'var(--vscode-descriptionForeground)' }}> | </span>}
                    </span>
                  ))
                : item.Type
              }
            </span>
          </div>
        )}
        {isChartOfAccounts && (
          <>
            {item.Parent && (
              <div className="property-row">
                <span className="property-name">Родитель:</span>
                <span className="property-value">{item.Parent}</span>
              </div>
            )}
            {item.AccountType && (
              <div className="property-row">
                <span className="property-name">Вид:</span>
                <span className="property-value">{item.AccountType}</span>
              </div>
            )}
            {item.OffBalance !== undefined && (
              <div className="property-row">
                <span className="property-name">Забалансовый:</span>
                <span className="property-value">{item.OffBalance ? 'Да' : 'Нет'}</span>
              </div>
            )}
            {item.Order && (
              <div className="property-row">
                <span className="property-name">Порядок:</span>
                <span className="property-value">{item.Order}</span>
              </div>
            )}
            <AccountingFlagsView item={item} />
            <ExtDimensionTypesView item={item} />
          </>
        )}
        <div className="property-row">
          <span className="property-name">Папка:</span>
          <span className="property-value">{item.IsFolder ? 'Да' : 'Нет'}</span>
        </div>
        {/* Отображение дочерних элементов */}
        {item.ChildItems && item.ChildItems.Item && item.ChildItems.Item.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--vscode-panel-border)' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
              Дочерние элементы ({item.ChildItems.Item.length}):
            </div>
            <div 
              className="child-items-container"
              style={{ 
                marginLeft: '16px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '8px'
              }}>
              {item.ChildItems.Item.map((childItem, childIndex) => {
                const childPath: number[] = parentPath !== undefined ? [...parentPath, index, childIndex] : [index, childIndex];
                const isEditing: boolean = !!(editingChild && editingChild.path.length === childPath.length &&
                  editingChild.path.every((p, i) => p === childPath[i]));
                const childKey = childItem.id || `${childItem.Code}-${childItem.Name}-${childIndex}`;
                return (
                  <PredefinedItemCard
                    key={childKey}
                    item={childItem}
                    index={childIndex}
                    parentPath={parentPath !== undefined ? [...parentPath, index] : [index]}
                    isChartOfAccounts={isChartOfAccounts}
                    isChartOfCharacteristicTypes={isChartOfCharacteristicTypes}
                    chartOfAccountsData={chartOfAccountsData}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onEditChild={onEditChild}
                    onDeleteChild={onDeleteChild}
                    editingChild={editingChild}
                    editingItem={editingItem}
                    onSave={onSave}
                    onCancel={onCancel}
                    onChange={onChange}
                    onOpenTypeModal={onOpenTypeModal}
                    isBeingEdited={isEditing}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditItemCardProps {
  item: PredefinedDataItem | null;
  index?: number;
  parentPath?: number[];
  isChartOfCharacteristicTypes: boolean;
  isChartOfAccounts: boolean;
  chartOfAccountsData?: ChartOfAccountsData;
  onSave: (item: PredefinedDataItem) => void;
  onCancel: () => void;
  onChange: (item: PredefinedDataItem) => void;
  onOpenTypeModal: (mode: 'add' | 'edit', currentType?: string) => void;
  onEditChild?: (path: number[]) => void;
  onDeleteChild?: (path: number[]) => void;
  editingChild?: { path: number[] } | null;
  editingItem?: PredefinedDataItem | null;
  showInModal?: boolean;
}

const EditItemCard: React.FC<EditItemCardProps> = ({ 
  item, 
  index = 0,
  parentPath,
  isChartOfCharacteristicTypes,
  isChartOfAccounts,
  chartOfAccountsData,
  onSave, 
  onCancel, 
  onChange,
  onOpenTypeModal,
  onEditChild,
  onDeleteChild,
  editingChild,
  editingItem,
  showInModal = false
}) => {
  if (!item) return null;

  const handleSave = () => {
    if (!item.Name || !item.Code) {
      alert('Заполните обязательные поля: Имя и Код');
      return;
    }
    onSave(item);
  };

  return (
    <div 
      className="attribute-card" 
      style={{ 
        border: showInModal ? '1px solid var(--vscode-panel-border)' : '2px solid var(--vscode-focusBorder)',
        padding: showInModal ? '0' : undefined
      }}
    >
      <div className="attribute-header">
        {!showInModal && <h4>Редактирование элемента</h4>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-edit-type"
            type="button"
            onClick={handleSave}
            title="Сохранить"
            aria-label="Сохранить"
            style={{ 
              padding: '4px 8px', 
              fontSize: '12px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Сохранить
          </button>
          <button
            className="btn-edit-type"
            type="button"
            onClick={onCancel}
            title="Отмена"
            aria-label="Отмена"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
        </div>
      </div>
      <div className="attribute-properties">
        <div className="property-row">
          <span className="property-name">Имя: *</span>
          <input 
            type="text" 
            value={item.Name || ''} 
            onChange={(e) => onChange({...item, Name: e.target.value})} 
            placeholder="Имя"
            style={{
              padding: '4px 8px',
              border: '1px solid var(--vscode-input-border)',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              borderRadius: '3px',
              fontSize: '12px',
              flex: 1
            }}
          />
        </div>
        <div className="property-row">
          <span className="property-name">Код: *</span>
          <input 
            type="text" 
            value={item.Code || ''} 
            onChange={(e) => onChange({...item, Code: e.target.value})} 
            placeholder="Код"
            style={{
              padding: '4px 8px',
              border: '1px solid var(--vscode-input-border)',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              borderRadius: '3px',
              fontSize: '12px',
              flex: 1
            }}
          />
        </div>
        <div className="property-row">
          <span className="property-name">Наименование:</span>
          <input 
            type="text" 
            value={item.Description || ''} 
            onChange={(e) => onChange({...item, Description: e.target.value})} 
            placeholder="Наименование"
            style={{
              padding: '4px 8px',
              border: '1px solid var(--vscode-input-border)',
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              borderRadius: '3px',
              fontSize: '12px',
              flex: 1
            }}
          />
        </div>
        {isChartOfCharacteristicTypes && (
          <div className="property-row">
            <span className="property-name">Тип:</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
              <input 
                type="text" 
                value={item.Type || ''} 
                readOnly
                placeholder="Нажмите кнопку для выбора типа"
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--vscode-input-border)',
                  background: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  borderRadius: '3px',
                  fontSize: '12px',
                  flex: 1,
                  fontFamily: 'monospace'
                }}
              />
              <button 
                type="button"
                onClick={() => onOpenTypeModal('edit', item.Type || '')}
                title="Открыть редактор типов"
                aria-label="Открыть редактор типов"
                style={{
                  padding: '4px 8px',
                  background: 'var(--vscode-button-secondaryBackground)',
                  color: 'var(--vscode-button-secondaryForeground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                Выбрать
              </button>
            </div>
          </div>
        )}
        {isChartOfAccounts && (
          <>
            {item.Parent && (
              <div className="property-row">
                <span className="property-name">Родитель:</span>
                <input 
                  type="text" 
                  value={item.Parent} 
                  readOnly
                  style={{
                    padding: '4px 8px',
                    border: '1px solid var(--vscode-input-border)',
                    background: 'var(--vscode-input-background)',
                    color: 'var(--vscode-input-foreground)',
                    borderRadius: '3px',
                    fontSize: '12px',
                    flex: 1,
                    opacity: 0.7,
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            )}
            <div className="property-row">
              <span className="property-name">Вид:</span>
              <select
                value={item.AccountType || ''}
                onChange={(e) => onChange({...item, AccountType: e.target.value as 'Active' | 'Passive' | 'ActivePassive' | undefined})}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--vscode-input-border)',
                  background: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  borderRadius: '3px',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                <option value="">Не указан</option>
                <option value="Active">Активный</option>
                <option value="Passive">Пассивный</option>
                <option value="ActivePassive">Активно-Пассивный</option>
              </select>
            </div>
            <div className="property-row">
              <span className="property-name">Забалансовый:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={item.OffBalance || false} 
                  onChange={(e) => onChange({...item, OffBalance: e.target.checked})}
                  style={{ cursor: 'pointer' }}
                />
                <span>{item.OffBalance ? 'Да' : 'Нет'}</span>
              </label>
            </div>
            <div className="property-row">
              <span className="property-name">Порядок:</span>
              <input 
                type="text" 
                value={item.Order || ''} 
                onChange={(e) => onChange({...item, Order: e.target.value})} 
                placeholder="Порядок"
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--vscode-input-border)',
                  background: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  borderRadius: '3px',
                  fontSize: '12px',
                  flex: 1
                }}
              />
            </div>
            {chartOfAccountsData && (
              <>
                <AccountingFlagsTable
                  accountingFlags={chartOfAccountsData.accountingFlags}
                  item={item}
                  onChange={onChange}
                />
                <ExtDimensionTypesTable
                  dimensionTypes={chartOfAccountsData.dimensionTypes}
                  extDimensionAccountingFlags={chartOfAccountsData.extDimensionAccountingFlags}
                  item={item}
                  onChange={onChange}
                />
              </>
            )}
          </>
        )}
        <div className="property-row">
          <span className="property-name">Папка:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={item.IsFolder || false} 
              onChange={(e) => onChange({...item, IsFolder: e.target.checked})}
              style={{ cursor: 'pointer' }}
            />
            <span>{item.IsFolder ? 'Да' : 'Нет'}</span>
          </label>
        </div>
        {/* Список вложенных элементов при редактировании группы */}
        {item.ChildItems && item.ChildItems.Item && item.ChildItems.Item.length > 0 && onEditChild && onDeleteChild && editingItem && onSave && onCancel && onChange && onOpenTypeModal && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--vscode-panel-border)' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
              Вложенные элементы ({item.ChildItems.Item.length}):
            </div>
            <div 
              className="child-items-container"
              style={{ 
                marginLeft: '16px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '8px'
              }}
            >
              {item.ChildItems.Item.map((childItem, childIndex) => {
                const itemPath: number[] = parentPath ?? [index];
                const childPath: number[] = [...itemPath, childIndex];
                const isEditing: boolean = !!(editingChild && editingChild.path.length === childPath.length &&
                  editingChild.path.every((p, i) => p === childPath[i]));
                const childKey = childItem.id || `${childItem.Code}-${childItem.Name}-${childIndex}`;
                return (
                  <PredefinedItemCard
                    key={childKey}
                    item={childItem}
                    index={childIndex}
                    parentPath={itemPath}
                    isChartOfAccounts={isChartOfAccounts}
                    isChartOfCharacteristicTypes={isChartOfCharacteristicTypes}
                    chartOfAccountsData={chartOfAccountsData}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onEditChild={onEditChild}
                    onDeleteChild={onDeleteChild}
                    editingChild={editingChild}
                    editingItem={editingItem}
                    onSave={onSave}
                    onCancel={onCancel}
                    onChange={onChange}
                    onOpenTypeModal={onOpenTypeModal}
                    isBeingEdited={isEditing}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
