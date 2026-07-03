/**
 * Parser CSV mínimo e self-contained (sem dependências).
 * Suporta: delimitador , ou ; (autodetectado), aspas duplas com escape ("")
 * e quebras de linha dentro de campos entre aspas. Cobre o caso de planilhas
 * exportadas do Excel/Google Sheets, que é o alvo da importação (spec 0008).
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Detecta o delimitador olhando a primeira linha (vírgula vs ponto-e-vírgula). */
function detectDelimiter(sample: string): "," | ";" {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Faz o parsing completo respeitando aspas. Retorna todas as linhas de células. */
function parseAll(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // pula a segunda aspa (escape "")
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else if (char === "\r") {
      // ignora; o \n seguinte fecha a linha
    } else {
      field += char;
    }
  }

  // último campo/linha (arquivo sem \n final)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Converte o texto CSV em { headers, rows }. Remove uma eventual linha de
 * cabeçalho vazia e o BOM do início. Linhas totalmente vazias são descartadas.
 */
export function parseCsv(rawText: string): ParsedCsv {
  const text = rawText.replace(/^﻿/, ""); // remove BOM
  if (!text.trim()) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(text);
  const all = parseAll(text, delimiter);

  const nonEmpty = all.filter(
    (r) => !(r.length === 1 && r[0].trim() === "")
  );
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim());
  const rows = nonEmpty.slice(1).map((r) => r.map((c) => c.trim()));

  return { headers, rows };
}
