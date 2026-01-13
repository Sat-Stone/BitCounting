import type { CSVParser, CSVParserResult, ParsedTransaction } from '../types';

export const lnmarketsFuturesParser: CSVParser = {
  name: 'LN Markets Futures',
  
  detect: (headers: string[], _rows?: string[][]): boolean => {
    const required = ['leverage', 'sumFundingFees', 'exitPrice', 'entryPrice', 'pl', 'closedAt'];
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
        const side = getVal(row, 'side');
        const canceled = getVal(row, 'canceled') === 'true';
        const closed = getVal(row, 'closed') === 'true';
        
        // Parse numeric values
        const pl = parseInt(getVal(row, 'pl') || '0', 10);
        const openingFee = parseInt(getVal(row, 'openingFee') || '0', 10);
        const closingFee = parseInt(getVal(row, 'closingFee') || '0', 10);
        const fundingFees = parseInt(getVal(row, 'sumFundingFees') || '0', 10);
        
        // Calculate total fees (opening + closing + funding)
        // Note: fundingFees can be negative (you receive funding) or positive (you pay funding)
        const totalFees = openingFee + closingFee + fundingFees;
        
        // Calculate net P&L (pl already includes fees impact, so we need to extract the gross P&L)
        // Gross P&L = pl + totalFees (because pl = gross - fees)
        // But wait - looking at the data:
        // pl = 10306, openingFee = 219, closingFee = 230, fundingFees = -61
        // We want: Trading Gain = pl - openingFee - closingFee - fundingFees
        // = 10306 - 219 - 230 - (-61) = 10306 - 219 - 230 + 61 = 9918
        const netPnL = pl - openingFee - closingFee - fundingFees;
        
        // Skip if canceled/not closed with 0 P&L and 0 fees
        if ((canceled || !closed) && netPnL === 0 && totalFees === 0) {
          continue;
        }
        
        // Parse trade details for note
        const quantity = getVal(row, 'quantity') || '0';
        const leverage = getVal(row, 'leverage') || '1';
        const entryPrice = getVal(row, 'entryPrice') || getVal(row, 'price') || '0';
        const exitPrice = getVal(row, 'exitPrice');
        
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
        
        // Determine category based on net P&L
        const category = netPnL >= 0 ? 'Trading Gain' : 'Trading Loss';
        
        // Build descriptive note
        const sideLabel = side === 'buy' ? 'Long' : 'Short';
        const exitPriceFormatted = exitPrice && exitPrice !== 'null' ? '$' + parseFloat(exitPrice).toLocaleString() : 'N/A';
        const note = `Futures ${sideLabel} ${quantity}USD @${leverage}x | Entry: $${parseFloat(entryPrice).toLocaleString()} Exit: ${exitPriceFormatted}`;
        
        transactions.push({
          id: `lnm-futures-${id}`,
          timestamp,
          amount_sats: netPnL,
          fee_sats: totalFees > 0 ? totalFees : 0, // Only positive fees
          fee_fiat: null,
          fee_fiat_currency: null,
          category,
          note,
          fiat_value: null,
          fiat_currency: null,
          currency: 'BTC',
          source_type: 'lnmarkets-futures',
          source_id: id,
        });
        
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e}`);
      }
    }
    
    return { transactions, errors, warnings };
  }
};