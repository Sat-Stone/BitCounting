import type { CSVParser, CSVParserResult, ParsedTransaction } from './types';
import { phoenixParser } from './parsers/phoenix';
import { bitstackParser } from './parsers/bitstack';
import { bullBitcoinParser } from './parsers/bullbitcoin';
import { lnmarketsFuturesParser } from './parsers/lnmarkets-futures';
import { lnmarketsOptionsParser } from './parsers/lnmarkets-options';


// Add to the parsers array:
const parsers: CSVParser[] = [
  phoenixParser,
  bitstackParser,
  bullBitcoinParser,
  lnmarketsFuturesParser,    
  lnmarketsOptionsParser,
];

export function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // Handle multi-line fields (quoted with newlines inside)
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      // Skip \r\n
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : 
                    firstLine.includes(';') ? ';' : ',';
  
  // Parse each line
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    
    return cells;
  };
  
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(parseRow);
  
  return { headers, rows };
}

export function detectParser(headers: string[]): CSVParser | null {
  for (const parser of parsers) {
    if (parser.detect(headers, [])) {
      return parser;
    }
  }
  return null;
}

export function getAvailableParsers(): { id: string; name: string }[] {
  return parsers.map((p, i) => ({ id: String(i), name: p.name }));
}

export function parseWithParser(
  parserIndex: number,
  headers: string[],
  rows: string[][]
): CSVParserResult {
  const parser = parsers[parserIndex];
  if (!parser) {
    return { transactions: [], errors: ['Invalid parser'], warnings: [] };
  }
  return parser.parse(headers, rows);
}

export { type ParsedTransaction, type CSVParserResult };