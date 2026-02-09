/**
 * Компонент для отображения таблицы видов субконто в режиме просмотра (readonly)
 */

import React from 'react';
import { PredefinedDataItem } from '../../../predefinedDataInterfaces';

interface ExtDimensionTypesViewProps {
  item: PredefinedDataItem;
}

export const ExtDimensionTypesView: React.FC<ExtDimensionTypesViewProps> = ({ item }) => {
  const extDimTypes = item.ExtDimensionTypes || [];

  if (extDimTypes.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div className="property-row">
        <span className="property-name">Виды субконто:</span>
        <span className="property-value">
          {extDimTypes.map(dt => dt.dimensionType).join(', ')}
        </span>
      </div>
      {extDimTypes.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--vscode-descriptionForeground)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                <th style={{ padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>Вид субконто</th>
                <th style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>Только обороты</th>
              </tr>
            </thead>
            <tbody>
              {extDimTypes.map((dimType, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                  <td style={{ padding: '4px' }}>{dimType.dimensionType}</td>
                  <td style={{ padding: '4px', textAlign: 'center' }}>{dimType.turnoverOnly ? 'Да' : 'Нет'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
