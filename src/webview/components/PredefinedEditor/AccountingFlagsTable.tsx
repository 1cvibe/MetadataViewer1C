/**
 * Компонент таблицы признаков учета для плана счетов
 */

import React from 'react';
import { PredefinedDataItem } from '../../../predefinedDataInterfaces';

interface AccountingFlagsTableProps {
  accountingFlags: string[]; // Список доступных признаков учета
  item: PredefinedDataItem;
  onChange: (item: PredefinedDataItem) => void;
}

export const AccountingFlagsTable: React.FC<AccountingFlagsTableProps> = ({
  accountingFlags,
  item,
  onChange
}) => {
  const flags = item.AccountingFlags || [];

  const handleFlagNameChange = (index: number, flagName: string) => {
    const newFlags = [...flags];
    newFlags[index] = { ...newFlags[index], flagName };
    onChange({ ...item, AccountingFlags: newFlags });
  };

  const handleEnabledChange = (index: number, enabled: boolean) => {
    const newFlags = [...flags];
    newFlags[index] = { ...newFlags[index], enabled };
    onChange({ ...item, AccountingFlags: newFlags });
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Признаки учета:</label>
      </div>
      {flags.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', fontStyle: 'italic' }}>
          Нет признаков учета
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
              <th style={{ padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Признак учета</th>
              <th style={{ padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Учитывать</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag, index) => {
              // Создаем список опций, включая текущее значение, даже если его нет в accountingFlags
              const allFlagNames = new Set(accountingFlags);
              if (flag.flagName && !allFlagNames.has(flag.flagName)) {
                allFlagNames.add(flag.flagName);
              }
              const flagOptions = Array.from(allFlagNames);
              
              return (
                <tr key={index} style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                  <td style={{ padding: '6px' }}>
                    <select
                      value={flag.flagName}
                      onChange={(e) => handleFlagNameChange(index, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid var(--vscode-input-border)',
                        background: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                    >
                      {flagOptions.map((flagName) => (
                        <option key={flagName} value={flagName}>
                          {flagName}
                        </option>
                      ))}
                    </select>
                  </td>
                <td style={{ padding: '6px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={(e) => handleEnabledChange(index, e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
