import type { CSVParser, CSVParserResult, ParsedTransaction } from '../types';

export const phoenixParser: CSVParser = {
  name: 'Phoenix Wallet',
  
  detect: (headers: string[]): boolean => {
    const required = ['date', 'id', 'type', 'amount_msat', 'payment_hash'];
    return required.every(h => headers.includes(h));
  },
  
  parse: (headers: string[], rows: string[][]): CSVParserResult => {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Get column indices
    const idx = {
      date: headers.indexOf('date'),
      id: headers.indexOf('id'),
      type: headers.indexOf('type'),
      amount_msat: headers.indexOf('amount_msat'),
      amount_fiat: headers.indexOf('amount_fiat'),
      mining_fee_sat: headers.indexOf('mining_fee_sat'),
      mining_fee_fiat: headers.indexOf('mining_fee_fiat'),
      service_fee_msat: headers.indexOf('service_fee_msat'),
      service_fee_fiat: headers.indexOf('service_fee_fiat'),
      payment_hash: headers.indexOf('payment_hash'),
      tx_id: headers.indexOf('tx_id'),
      description: headers.indexOf('description'),
    };
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) continue;
        
        // Parse date
        const dateStr = row[idx.date];
        if (!dateStr) {
          errors.push(`Row ${i + 1}: Missing date`);
          continue;
        }
        const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
        if (isNaN(timestamp)) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
          continue;
        }
        
        // Parse amount (millisats to sats)
        const amountMsat = parseInt(row[idx.amount_msat], 10);
        if (isNaN(amountMsat)) {
          errors.push(`Row ${i + 1}: Invalid amount "${row[idx.amount_msat]}"`);
          continue;
        }
        const amount_sats = Math.round(amountMsat / 1000);
        
        // Parse fees
        const miningFeeSat = parseInt(row[idx.mining_fee_sat] || '0', 10) || 0;
        const serviceFeeMsat = parseInt(row[idx.service_fee_msat] || '0', 10) || 0;
        const fee_sats = miningFeeSat + Math.round(serviceFeeMsat / 1000);
        
        // Parse fee fiat
        let fee_fiat: number | null = null;
        let fee_fiat_currency: string | null = null;
        
        const miningFeeFiatStr = row[idx.mining_fee_fiat];
        const serviceFeeFiatStr = row[idx.service_fee_fiat];
        
        if (miningFeeFiatStr || serviceFeeFiatStr) {
          let totalFeeFiat = 0;
          
          if (miningFeeFiatStr) {
            const match = miningFeeFiatStr.match(/^([\d.]+)\s*([A-Z]{3})$/);
            if (match) {
              totalFeeFiat += parseFloat(match[1]);
              fee_fiat_currency = match[2];
            }
          }
          
          if (serviceFeeFiatStr) {
            const match = serviceFeeFiatStr.match(/^([\d.]+)\s*([A-Z]{3})$/);
            if (match) {
              totalFeeFiat += parseFloat(match[1]);
              fee_fiat_currency = match[2];
            }
          }
          
          if (totalFeeFiat > 0) {
            fee_fiat = totalFeeFiat;
          }
        }
        
        // Parse fiat value
        let fiat_value: number | null = null;
        let fiat_currency: string | null = null;
        const fiatStr = row[idx.amount_fiat];
        if (fiatStr) {
          const fiatMatch = fiatStr.match(/^(-?[\d.]+)\s*([A-Z]{3})$/);
          if (fiatMatch) {
            fiat_value = parseFloat(fiatMatch[1]);
            fiat_currency = fiatMatch[2];
            // Make fiat negative if amount is negative
            if (amount_sats < 0 && fiat_value > 0) {
              fiat_value = -fiat_value;
            }
          }
        }
        
        // Determine category based on type
        const txType = row[idx.type];
        let category: string;
        switch (txType) {
          case 'swap_in':
            category = 'Transfer In';
            break;
          case 'swap_out':
            category = 'Transfer Out';
            break;
          case 'lightning_sent':
            category = 'Payment';
            break;
          case 'lightning_received':
            category = 'Income';
            break;
          default:
            category = 'Uncategorized';
            warnings.push(`Row ${i + 1}: Unknown transaction type "${txType}"`);
        }
        
        // Get note/description
        const note = row[idx.description] || '';
        
        // Get unique ID (payment_hash for lightning, tx_id for swaps, or phoenix id)
        const sourceId = row[idx.payment_hash] || row[idx.tx_id] || row[idx.id];
        
        transactions.push({
          id: `phoenix-${sourceId}`,
          timestamp,
          amount_sats,
          fee_sats,
          fee_fiat,
          fee_fiat_currency,
          category,
          note: note.trim(),
          fiat_value,
          fiat_currency,
          currency: 'BTC',
          source_type: 'phoenix',
          source_id: sourceId,
        });
        
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e}`);
      }
    }
    
    return { transactions, errors, warnings };
  }
};