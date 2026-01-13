import type { CSVParser, CSVParserResult, ParsedTransaction } from '../types';

export const bitstackParser: CSVParser = {
  name: 'Bitstack',
  
  detect: (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const required = ['type', 'date', 'received amount', 'sent amount', 'external id'];
    return required.every(h => normalizedHeaders.includes(h));
  },
  
  parse: (headers: string[], rows: string[][]): CSVParserResult => {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Get column indices (case-insensitive)
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
    
    const idx = {
      type: getIdx('type'),
      date: getIdx('date'),
      receivedAmount: getIdx('received amount'),
      receivedCurrency: getIdx('currency or token received'),
      sentAmount: getIdx('sent amount'),
      sentCurrency: getIdx('currency or token sent'),
      fee: getIdx('fee'),
      feeCurrency: getIdx('currency or token fee'),
      description: getIdx('description'),
      priceReceived: getIdx('token price of the amount received'),
      priceSent: getIdx('token price of the amount sent'),
      address: getIdx('address'),
      txHash: getIdx('transaction hash'),
      externalId: getIdx('external id'),
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
        
        const txType = row[idx.type]?.trim();
        const description = row[idx.description]?.trim() || '';
        const externalId = row[idx.externalId]?.trim();
        const txHash = row[idx.txHash]?.trim();
        
        if (!externalId) {
          errors.push(`Row ${i + 1}: Missing External ID`);
          continue;
        }
        
        let amount_sats = 0;
        let fee_sats = 0;
        let fee_fiat: number | null = null;
        let fee_fiat_currency: string | null = null;
        let fiat_value: number | null = null;
        let fiat_currency: string | null = null;
        let category = 'Uncategorized';
        
        // Parse fee
        const feeAmount = parseFloat(row[idx.fee] || '0');
        const feeCurrency = row[idx.feeCurrency]?.trim();
        if (feeAmount > 0 && feeCurrency) {
          if (feeCurrency === 'BTC') {
            fee_sats = Math.round(feeAmount * 100_000_000);
          } else {
            fee_fiat = feeAmount;
            fee_fiat_currency = feeCurrency;
          }
        }
        
        if (txType === 'Trade') {
          // Buying BTC with EUR
          const receivedAmount = parseFloat(row[idx.receivedAmount] || '0');
          const sentAmount = parseFloat(row[idx.sentAmount] || '0');
          
          if (isNaN(receivedAmount) || receivedAmount <= 0) {
            errors.push(`Row ${i + 1}: Invalid received amount`);
            continue;
          }
          
          amount_sats = Math.round(receivedAmount * 100_000_000);
          fiat_value = sentAmount + (fee_fiat || 0); // Total cost in EUR
          fiat_currency = 'EUR';
          category = 'Buy';
          
        } else if (txType === 'Deposit') {
          // Receiving BTC (gift, referral, etc.)
          const receivedAmount = parseFloat(row[idx.receivedAmount] || '0');
          const priceReceived = parseFloat(row[idx.priceReceived] || '0');
          
          if (isNaN(receivedAmount) || receivedAmount <= 0) {
            errors.push(`Row ${i + 1}: Invalid received amount`);
            continue;
          }
          
          amount_sats = Math.round(receivedAmount * 100_000_000);
          
          // Calculate fiat value from price
          if (priceReceived > 0) {
            fiat_value = receivedAmount * priceReceived;
            fiat_currency = 'EUR';
          }
          
          // Determine category based on description
          if (description.toLowerCase().includes('referral')) {
            category = 'Income';
          } else if (description.toLowerCase().includes('gift')) {
            category = 'Gift';
          } else {
            category = 'Income';
          }
          
        } else if (txType === 'Withdrawal') {
          // Sending BTC out
          const sentAmount = parseFloat(row[idx.sentAmount] || '0');
          const priceSent = parseFloat(row[idx.priceSent] || '0');
          
          if (isNaN(sentAmount) || sentAmount <= 0) {
            errors.push(`Row ${i + 1}: Invalid sent amount`);
            continue;
          }
          
          amount_sats = -Math.round(sentAmount * 100_000_000); // Negative for outgoing
          
          // Calculate fiat value from price
          if (priceSent > 0) {
            fiat_value = -(sentAmount * priceSent);
            fiat_currency = 'EUR';
          }
          
          category = 'Transfer Out';
          
        } else {
          warnings.push(`Row ${i + 1}: Unknown transaction type "${txType}"`);
          continue;
        }
        
        // Use txHash if available, otherwise externalId
        const sourceId = txHash || externalId;
        
        transactions.push({
          id: `bitstack-${externalId}`,
          timestamp,
          amount_sats,
          fee_sats,
          fee_fiat,
          fee_fiat_currency,
          category,
          note: description,
          fiat_value,
          fiat_currency,
          currency: 'BTC',
          source_type: 'bitstack',
          source_id: sourceId,
        });
        
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e}`);
      }
    }
    
    return { transactions, errors, warnings };
  }
};