import type { CSVParser, CSVParserResult, ParsedTransaction } from '../types';

export const lnmarketsOptionsParser: CSVParser = {
  name: 'LN Markets Options',
  
  detect: (headers: string[], _rows?: string[][]): boolean => {
    // Check for unique options columns
    const required = ['strike', 'expiry', 'exercised', 'volatility', 'pl', 'closedAt'];
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    return required.every(h => normalizedHeaders.includes(h.toLowerCase()));
  },
  
  parse: (headers: string[], rows: string[][]): CSVParserResult => {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Get column indices (case-insensitive)
    const idx: Record<string, number> = {};
    headers.forEach((h, i) => idx[h.toLowerCase().trim()] = i);
    
    const getVal = (row: string[], key: string): string => {
      const i = idx[key.toLowerCase()];
      if (i === undefined) return '';
      return (row[i] || '').replace(/^"|"$/g, '').trim();
    };
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) continue;
        
        const id = getVal(row, 'id');
        const side = getVal(row, 'side'); // 'b' = buy
        const optionType = getVal(row, 'type'); // 'c' = call, 'p' = put
        const closed = getVal(row, 'closed') === 'true';
        const expired = getVal(row, 'expired') === 'true';
        const exercised = getVal(row, 'exercised') === 'true';
        
        // Parse numeric values
        const pl = parseInt(getVal(row, 'pl') || '0', 10);
        const openingFee = parseInt(getVal(row, 'openingFee') || '0', 10);
        const closingFee = parseInt(getVal(row, 'closingFee') || '0', 10);
        const totalFees = openingFee + closingFee;
        
        // Skip if 0 P&L and 0 fees
        if (pl === 0 && totalFees === 0) {
          continue;
        }
        
        // Parse trade details for note
        const quantity = getVal(row, 'quantity') || '0';
        const strike = getVal(row, 'strike') || '0';
        const margin = getVal(row, 'margin') || '0'; // Premium paid
        
        // Parse date (closedAt)
        const closedAtStr = getVal(row, 'closedAt');
        if (!closedAtStr) {
          warnings.push(`Row ${i + 1}: Missing closedAt date, skipping`);
          continue;
        }
        
        const timestamp = Math.floor(new Date(closedAtStr).getTime() / 1000);
        if (isNaN(timestamp)) {
          errors.push(`Row ${i + 1}: Invalid date format "${closedAtStr}"`);
          continue;
        }
        
        // Determine category based on P&L
        const category = pl >= 0 ? 'Trading Gain' : 'Trading Loss';
        
        // Build descriptive note
        const typeLabel = optionType === 'c' ? 'Call' : 'Put';
        const sideLabel = side === 'b' ? 'Buy' : 'Sell';
        let status = 'Closed';
        if (expired) status = 'Expired';
        else if (exercised) status = 'Exercised';
        else if (closed) status = 'Closed';
        
        const note = `Option ${sideLabel} ${typeLabel} $${parseFloat(strike).toLocaleString()} ${quantity}USD | Premium: ${parseInt(margin).toLocaleString()} sats | ${status}`;
        
        transactions.push({
          id: `lnm-options-${id}`,
          timestamp,
          amount_sats: pl,
          fee_sats: totalFees,
          fee_fiat: null,
          fee_fiat_currency: null,
          category,
          note,
          fiat_value: null,
          fiat_currency: null,
          currency: 'BTC',
          source_type: 'lnmarkets-options',
          source_id: id,
        });
        
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e}`);
      }
    }
    
    return { transactions, errors, warnings };
  }
};