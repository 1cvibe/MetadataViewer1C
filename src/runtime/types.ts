export type ConfigType = 'xml' | 'edt';

export interface SerializableCommand {
  command: string;
  title?: string;
  arguments?: any[];
}

export interface SerializableTreeNode {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  contextValue?: string;
  path?: string;
  parentId?: string;
  isConfiguration?: boolean;
  configType?: ConfigType;
  icon?: string;
  command?: SerializableCommand;
  children?: SerializableTreeNode[];
}

export interface TreeCacheEnvelope {
  version: string;
  fingerprint: string;
  builtAt: number;
  root: SerializableTreeNode;
  objectHashes?: Record<string, string>;
  objectNodes?: Record<string, SerializableTreeNode>;
}

