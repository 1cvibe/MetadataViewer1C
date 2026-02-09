/**
 * Компонент для отображения таблицы признаков учета в режиме просмотра (readonly)
 */

import React from 'react';
import { PredefinedDataItem } from '../../../predefinedDataInterfaces';

interface AccountingFlagsViewProps {
  item: PredefinedDataItem;
}

export const AccountingFlagsView: React.FC<AccountingFlagsViewProps> = ({ item }) => {
  const flags = item.AccountingFlags || [];

  if (flags.length === 0) {
    return null;
  }

  const enabledFlags = flags.filter(f => f.enabled);

  return (
    <div className="property-row" style={{ marginTop: '8px' }}>
      <span className="property-name">Признаки учета:</span>
      <span className="property-value">
        {enabledFlags.length > 0 
          ? enabledFlags.map(f => f.flagName).join(', ')
          : 'Нет'
        }
      </span>
    </div>
  );
};
