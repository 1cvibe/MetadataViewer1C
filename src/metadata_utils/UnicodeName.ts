/**
 * 1C конфигурации, выгруженные в XML, иногда содержат имена файлов/папок
 * в виде #UXXXX (UTF-16 code unit в hex). Например: "#U041F#U0440#U0438#U043C#U0435#U0440".
 */

const UNICODE_SEQ = /#U([0-9A-Fa-f]{4})/g;

/**
 * Декодирует "#UXXXX" последовательности в строке.
 * Невалидные последовательности оставляет как есть.
 */
export function decode1CUnicodeEscapes(input: string): string {
  if (!input || !input.includes("#U")) return input;

  return input.replace(UNICODE_SEQ, (_m, hex: string) => {
    const code = parseInt(hex, 16);
    if (Number.isNaN(code)) return `#U${hex}`;
    return String.fromCharCode(code);
  });
}

/** Имя без расширения. */
export function basenameWithoutExt(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? fileName : fileName.slice(0, dot);
}
