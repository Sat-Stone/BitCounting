export interface ParsedTransaction {
  id: string;
  timestamp: number;
  amount_sats: number;
  fee_sats: number;
  fee_fiat: number | null;
  fee_fiat_currency: string | null;
  category: string;
  note: string;
  fiat_value: number | null;
  fiat_currency: string | null;
  currency: string; // 'BTC', 'EUR', 'USD'
  source_type: string;
  source_id: string;
}

export interface CSVParserResult {
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
}

export interface CSVParser {
  name: string;
  detect: (headers: string[], rows: string[][]) => boolean;
  parse: (headers: string[], rows: string[][]) => CSVParserResult;
}