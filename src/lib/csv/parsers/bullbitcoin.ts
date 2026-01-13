import type { CSVParser, CSVParserResult, ParsedTransaction } from '../types';

export const bullBitcoinParser: CSVParser = {
  name: 'Bull Bitcoin',
  
  detect: (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const required = ['order_number', 'order_type', 'order_id', 'payin_amount', 'payout_amount'];
    return required.every(h => normalizedHeaders.includes(h));
  },
  
  parse: (headers: string[], rows: string[][]): CSVParserResult => {
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Get column indices (case-insensitive)
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
    
    const idx = {
      orderNumber: getIdx('order_number'),
      orderType: getIdx('order_type'),
      orderSubtype: getIdx('order_subtype'),
      orderId: getIdx('order_id'),
      payinAmount: getIdx('payin_amount'),
      payinCurrency: getIdx('payin_currency'),
      payoutAmount: getIdx('payout_amount'),
      payoutCurrency: getIdx('payout_currency'),
      exchangeRate: getIdx('exchange_rate_amount'),
      orderStatus: getIdx('order_status'),
      createdAt: getIdx('created_at (utc)'),
      completedAt: getIdx('completed_at (utc)'),
      transactionId: getIdx('transaction_id'),
      address: getIdx('address'),
    };
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Skip empty rows
        if (row.length === 0 || row.every(cell => !cell.trim())) continue;
        
        const orderType = row[idx.orderType]?.trim();
        const orderStatus = row[idx.orderStatus]?.trim();
        const orderId = row[idx.orderId]?.trim();
        
        // Skip non-completed orders
        if (orderStatus !== 'Completed') {
          continue;
        }
        
        if (!orderId) {
          errors.push(`Row ${i + 1}: Missing Order ID`);
          continue;
        }
        
        // Parse date (prefer completed_at, fallback to created_at)
        const dateStr = row[idx.completedAt]?.trim() || row[idx.createdAt]?.trim();
        if (!dateStr) {
          errors.push(`Row ${i + 1}: Missing date`);
          continue;
        }
        const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
        if (isNaN(timestamp)) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
          continue;
        }
        
        const payinAmount = parseFloat(row[idx.payinAmount] || '0');
        const payinCurrency = row[idx.payinCurrency]?.trim();
        const payoutAmount = parseFloat(row[idx.payoutAmount] || '0');
        const payoutCurrency = row[idx.payoutCurrency]?.trim();
        const transactionId = row[idx.transactionId]?.trim();
        
        let amount_sats = 0;
        let fiat_value: number | null = null;
        let fiat_currency: string | null = 'EUR';
        let category = 'Uncategorized';
        let currency = 'BTC';
        
        if (orderType === 'Buy Bitcoin') {
          // Buying BTC/LBTC with EUR
          if (payoutCurrency !== 'LBTC' && payoutCurrency !== 'BTC') {
            warnings.push(`Row ${i + 1}: Unexpected payout currency "${payoutCurrency}"`);
            continue;
          }
          
          amount_sats = Math.round(payoutAmount * 100_000_000);
          fiat_value = payinAmount; // EUR spent
          category = 'Buy';
          currency = 'BTC';
          
        } else if (orderType === 'Sell Bitcoin' || orderType === 'Fiat Payment') {
          // Selling BTC/LBTC for EUR
          if (payinCurrency !== 'LBTC' && payinCurrency !== 'BTC') {
            warnings.push(`Row ${i + 1}: Unexpected payin currency "${payinCurrency}"`);
            continue;
          }
          
          amount_sats = -Math.round(payinAmount * 100_000_000); // Negative for selling
          fiat_value = -payoutAmount; // EUR received (negative to match amount)
          category = 'Sell';
          currency = 'BTC';
          
        } else if (orderType === 'Funding') {
          // Adding EUR to balance - this is a fiat transaction
          if (payoutCurrency === 'EUR') {
            amount_sats = Math.round(payoutAmount * 100); // Store cents
            fiat_value = payoutAmount;
            fiat_currency = 'EUR';
            category = 'Transfer In';
            currency = 'EUR';
          } else {
            continue;
          }
          
        } else if (orderType === 'Withdraw') {
          // Withdrawing EUR - this is a fiat transaction
          if (payinCurrency === 'EUR') {
            amount_sats = -Math.round(payinAmount * 100); // Store cents, negative
            fiat_value = -payinAmount;
            fiat_currency = 'EUR';
            category = 'Transfer Out';
            currency = 'EUR';
          } else {
            continue;
          }
          
        } else {
          // Skip other transaction types
          continue;
        }
        
        if (amount_sats === 0) {
          warnings.push(`Row ${i + 1}: Zero amount, skipping`);
          continue;
        }
        
        // Use transaction ID if available, otherwise order ID
        const sourceId = transactionId || orderId;
        
        transactions.push({
          id: `bullbitcoin-${orderId}`,
          timestamp,
          amount_sats,
          fee_sats: 0,
          fee_fiat: null,
          fee_fiat_currency: null,
          category,
          note: row[idx.orderSubtype]?.trim() || '',
          fiat_value,
          fiat_currency,
          currency,
          source_type: 'bullbitcoin',
          source_id: sourceId,
        });
        
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e}`);
      }
    }
    
    return { transactions, errors, warnings };
  }
};