/**
 * Компонент XML редактора на основе Monaco Editor
 */

import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface XmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export const XmlEditor: React.FC<XmlEditorProps> = ({
  value,
  onChange,
  language = 'xml'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Создаем редактор
    const editor = monaco.editor.create(containerRef.current, {
      value: value || '',
      language: language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true
    });

    editorRef.current = editor;

    // Обработка изменений
    const disposable = editor.onDidChangeModelContent(() => {
      const currentValue = editor.getValue();
      onChange(currentValue);
    });

    return () => {
      disposable.dispose();
      editor.dispose();
    };
  }, []);

  // Обновляем значение при изменении пропса
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value || '');
    }
  }, [value]);

  return (
    <div className="xml-editor">
      <div className="xml-editor-toolbar">
        <span className="xml-editor-title">XML</span>
      </div>
      <div ref={containerRef} className="xml-editor-container" />
    </div>
  );
};

