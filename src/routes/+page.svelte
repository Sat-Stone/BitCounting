<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import Modal from "$lib/components/Modal.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import ConfirmDelete from "$lib/components/ConfirmDelete.svelte";
  import Wallet from "$lib/icons/Wallet.svelte";
  import Refresh from "$lib/icons/Refresh.svelte";
  import Bitcoin from "$lib/icons/Bitcoin.svelte";
  import Plus from "$lib/icons/Plus.svelte";
  import Briefcase from "$lib/icons/Briefcase.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import BarChart from "$lib/components/BarChart.svelte";
  import PieChart from "$lib/components/PieChart.svelte";
  import LineChart from "$lib/components/LineChart.svelte";
  import { parseCSV, detectParser, type ParsedTransaction } from '$lib/csv';

  interface Entity {
    id: number;
    name: string;
    entity_type: string;
    parent_id: number | null;
  }

  interface Category {
    id: number;
    name: string;
    is_system: boolean;
  }

  // Categories state
  let categories = $state<Category[]>([]);
  let showAddCategory = $state(false);
  let newCategoryName = $state("");
  let showEditCategory = $state(false);
  let editingCategory = $state<Category | null>(null);
  let editCategoryName = $state("");
  let showDeleteCategory = $state(false);
  let categoryToDelete = $state<Category | null>(null);

  interface WalletData {
    id: number;
    name: string;
    xpub: string;
    wallet_type: string;
    entity_id: number;
    owner_name: string;
    owner_type: string;
  }

  interface Transaction {
    txid: string;
    amount_sats: number;
    fee_sats: number;
    confirmed: boolean;
    block_height: number | null;
    timestamp: number | null;
  }

  interface TransactionWithDetails {
    id: number;
    wallet_id: number;
    txid: string;
    amount_sats: number;
    fee_sats: number;
    fee_fiat: number | null;
    fee_fiat_currency: string | null;
    confirmed: boolean;
    block_height: number | null;
    timestamp: number | null;
    category: string | null;
    note: string | null;
    fiat_value: number | null;
    fiat_currency: string | null;
    currency: string | null;
    wallet_name: string;
    owner_name: string;
  }

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  // State
  let entities: Entity[] = $state([]);
  let wallets: WalletData[] = $state([]);
  let transactions: TransactionWithDetails[] = $state([]);
  let balances: Record<number, number> = $state({});
  let walletIsManual = $state(false);
  
  let message = $state("");
  let messageType: "info" | "success" | "error" = $state("info");
  
  // View state
  let activeTab: "dashboard" | "wallets" | "transactions" | "settings" = $state("dashboard");
  let selectedEntityId = $state<number | null>(null);
  let selectedWalletId = $state<number | null>(null);  // <-- Add this

  // Date filter state
  let filterYear = $state<number | null>(null);
  let filterMonth = $state<number | null>(null);
  
  // Sort state
  type SortKey = "timestamp" | "amount_sats" | "wallet_name" | "category";
  type SortDir = "asc" | "desc";
  let sortKey = $state<SortKey>("timestamp");
  let sortDir = $state<SortDir>("desc");

  // Encryption state
  let appLocked = $state(true);
  let dbEncrypted = $state(false);
  let checkingEncryption = $state(true);
  let unlockPassphrase = $state("");
  let unlockError = $state("");
  let unlockMode = $state<"passphrase" | "recovery">("passphrase");
  let recoveryInput = $state("");

  // Encryption setup modal
  let showEncryptionSetup = $state(false);
  let encryptPassphrase = $state("");
  let encryptPassphraseConfirm = $state("");
  let encryptRecoveryPhrase = $state("");
  let recoveryPhraseConfirmed = $state(false);
  let encryptionStep = $state<"passphrase" | "recovery" | "confirm">("passphrase");
  let passwordStrength = $state<{ score: number; level: string; label: string } | null>(null);

  // Change passphrase modal
  let showChangePassphrase = $state(false);
  let currentPassphrase = $state("");
  let newPassphrase = $state("");
  let newPassphraseConfirm = $state("");
  let newPasswordStrength = $state<{ score: number; level: string; label: string } | null>(null);

  // View recovery modal
  let showViewRecovery = $state(false);
  let viewRecoveryPassphrase = $state("");
  let viewRecoveryError = $state("");
  let viewRecoveryPhrase = $state("");

  // Remove encryption modal
  let showRemoveEncryption = $state(false);
  let removeEncryptionPassphrase = $state("");

  // Auto-lock
  let autoLockTime = $state<"never" | "5" | "15" | "30" | "60">("never");
  let lastActivityTime = $state(Date.now());
  let autoLockInterval: ReturnType<typeof setInterval> | null = null;
  
  // Modal state
  let showAddWallet = $state(false);
  let showAddEntity = $state(false);
  let entityModalType: "family" | "business" = $state("family");
  let showDeleteWallet = $state(false);
  let walletToDelete: WalletData | null = $state(null);
  let showDeleteEntity = $state(false);
  let entityToDelete: Entity | null = $state(null);
  let showEditWallet = $state(false);
  let walletToEdit: WalletData | null = $state(null);
  let editWalletName = $state("");
  let editWalletEntityId = $state(1);

  // CSV Import state
  let showImportCSV = $state(false);
  let importStep: "upload" | "preview" | "importing" | "done" = $state("upload");
  let importFile: File | null = $state(null);
  let importWalletId = $state<number>(0);
  let importParserName = $state("");
  let importTransactions = $state<ParsedTransaction[]>([]);
  let importErrors = $state<string[]>([]);
  let importWarnings = $state<string[]>([]);
  let importResult = $state<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // Fiat currency change confirmation
  let showFiatChangeConfirm = $state(false);
  let pendingFiatCurrency = $state<"EUR" | "USD" | null>(null);

  // Manual transaction modal
  let showAddTransaction = $state(false);
  let txType: "incoming" | "outgoing" = $state("incoming");
  let txAmount = $state("");
  let txWalletId = $state<number>(0);
  let txCategory = $state("Uncategorized");
  let txNote = $state("");
  let txDate = $state(new Date().toISOString().split('T')[0]);
  let txFiatValue = $state("");
  let txCurrency = $state<"BTC" | "EUR" | "USD">("BTC");
  let txFeeSats = $state("");
  let txFeeFiat = $state("");

  // Edit transaction modal
  let showEditTransaction = $state(false);
  let editingTx: TransactionWithDetails | null = $state(null);
  let editTxType: "incoming" | "outgoing" = $state("incoming");
  let editTxAmount = $state("");
  let editTxCategory = $state("Uncategorized");
  let editTxNote = $state("");
  let editTxDate = $state("");
  let editTxFiatValue = $state("");
  let editTxCurrency = $state<"BTC" | "EUR" | "USD">("BTC");
  let editTxFeeSats = $state("");
  let editTxFeeFiat = $state("");
  
  // Delete transaction
  let showDeleteTransaction = $state(false);
  let txToDelete: TransactionWithDetails | null = $state(null);
  
  // Form state
  let walletName = $state("");
  let walletXpub = $state("");
  let walletType = $state("zpub");
  let walletEntityId = $state(1);
  
  let newEntityName = $state("");
  let newBusinessParent = $state<number | null>(null);
  
  // Loading state
  let loadingTxs = $state(false);
  let syncingWallet = $state<number | null>(null);

  // Currency format
  type CurrencyFormat = "sats" | "btc";
  let currencyFormat = $state<CurrencyFormat>("sats");

  // Settings page state
  let activeSettingsTab = $state<"display" | "pnl" | "categories" | "accounts" | "wallets" | "security" | "data">("display");
  let exportingData = $state(false);
  let showResetConfirm = $state(false);
  let theme = $state<"dark" | "light">("dark");

  // Fiat state
  let fiatEnabled = $state(true);
  let fiatCurrency = $state<"EUR" | "USD">("EUR");
  let currentFiatPrice = $state<number | null>(null);
  let dayOpenPrice = $state<number | null>(null); 
  let priceLoading = $state(false);
  let priceLastUpdated = $state<Date | null>(null);
  let showPriceChange = $state(false);
  let previousPrice = $state<number | null>(null);
  let fetchingFiatValues = $state(false);

  // Duplicate transaction modal
  let showDuplicateTransaction = $state(false);
  let duplicatingTx: TransactionWithDetails | null = $state(null);

  // Cost basis method
  let costBasisMethod = $state<"average" | "fifo">("average");

  // Wallet page collapse state
  let collapsedTypes = $state<Record<string, boolean>>({
    personal: true,
    family: true,
    business: true
  });

  let collapsedEntities = $state<Record<number, boolean>>({});

  // Derived
  let entityOptions = $derived([
    { value: null, label: "All accounts", type: "all" },
    ...entities.map(e => ({ value: e.id, label: e.name, type: e.entity_type }))
  ]);

  // Category names for dropdowns
  let categoryNames = $derived(categories.map(c => c.name));

  // Wallet options filtered by selected entity
  let walletOptions = $derived.by(() => {
    const filtered = selectedEntityId 
      ? wallets.filter(w => w.entity_id === selectedEntityId)
      : wallets;
    
    return [
      { value: null, label: "All wallets" },
      ...filtered.map(w => ({ value: w.id, label: w.name }))
    ];
  });

  let availableYears = $derived.by(() => {
    const years = new Set<number>();
    for (const tx of transactions) {
      if (tx.timestamp) {
        years.add(new Date(tx.timestamp * 1000).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  let filteredTransactions = $derived.by(() => {
    return transactions.filter(tx => {
      // Wallet filter
      if (selectedWalletId !== null && tx.wallet_id !== selectedWalletId) return false;
      
      // Date filters
      if (!tx.timestamp) return filterYear === null && filterMonth === null;
      const date = new Date(tx.timestamp * 1000);
      const txYear = date.getFullYear();
      const txMonth = date.getMonth() + 1;
      if (filterYear !== null && txYear !== filterYear) return false;
      if (filterMonth !== null && txMonth !== filterMonth) return false;
      return true;
    });
  });

  let sortedTransactions = $derived.by(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      if (sortKey === "timestamp") {
        aVal = a.timestamp ?? 0;
        bVal = b.timestamp ?? 0;
      } else if (sortKey === "amount_sats") {
        aVal = a.amount_sats;
        bVal = b.amount_sats;
      } else if (sortKey === "wallet_name") {
        aVal = a.wallet_name.toLowerCase();
        bVal = b.wallet_name.toLowerCase();
      } else if (sortKey === "category") {
        aVal = (a.category ?? "").toLowerCase();
        bVal = (b.category ?? "").toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  });

  const categoryColors: Record<string, string> = {
    "Buy": "#4ade80",
    "Sell": "#f87171",
    "Transfer In": "#888888",
    "Transfer Out": "#888888",
    "Income": "#4ade80",
    "Gift": "#a78bfa",
    "Food": "#fb923c",
    "Utilities": "#38bdf8",
    "Shopping": "#f472b6",
    "Trading Gain": "#4ade80",
    "Trading Loss": "#f87171",
    "Mining": "#fbbf24",
    "Lending Interest (Income)": "#4ade80",
    "Lending Interest (Cost)": "#f87171",
    "Receive Loan": "#60a5fa",
    "Repay Loan": "#f87171",
    "Liquidation": "#ef4444",
    "Uncategorized": "#444444"
  };

  const EXCLUDED_FROM_TOTALS = ["Transfer In", "Transfer Out", "Receive Loan", "Repay Loan"];

  // BTC-only transactions for balance calculations
  let btcTransactions = $derived(
    filteredTransactions.filter(tx => (tx.currency || 'BTC') === 'BTC')
  );

  let categoryBreakdown = $derived.by(() => {
    const breakdown: Record<string, number> = {};
    for (const tx of btcTransactions) {
      if (tx.amount_sats < 0 && !EXCLUDED_FROM_TOTALS.includes(tx.category || "")) {
        const cat = tx.category || "Uncategorized";
        breakdown[cat] = (breakdown[cat] || 0) + Math.abs(tx.amount_sats);
      }
    }
    return Object.entries(breakdown)
      .map(([label, value]) => ({ label, value, color: categoryColors[label] || "#666" }))
      .sort((a, b) => b.value - a.value);
  });

  let monthlyBalance = $derived.by(() => {
    const monthly: Record<string, number> = {};
    for (const tx of btcTransactions) {
      if (tx.timestamp) {
        const date = new Date(tx.timestamp * 1000);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + tx.amount_sats;
      }
    }
    const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    return sorted.map(([key, value]) => {
      const [, month] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return { label: monthNames[parseInt(month) - 1], value, color: value >= 0 ? '#4ade80' : '#f87171' };
    });
  });

  // Income categories (positive inflows)
const INCOME_CATEGORIES = [
  "Trading Gain", "Buy", "Income", "Mining", "Lending Interest (Income)"
];

// Expense categories (negative outflows)  
const EXPENSE_CATEGORIES = [
  "Trading Loss", "Sell", "Lending Interest (Cost)", "Liquidation",
  "Food", "Shopping", "Utilities"
];

// Total income (BTC only) - includes Gift if positive
  let totalIncome = $derived(
    btcTransactions
      .filter(tx => {
        const cat = tx.category || "Uncategorized";
        if (INCOME_CATEGORIES.includes(cat) && tx.amount_sats > 0) return true;
        if (cat === "Gift" && tx.amount_sats > 0) return true;
        return false;
      })
      .reduce((sum, tx) => sum + tx.amount_sats, 0)
  );

  // Total spent (BTC only) - includes Gift if negative
  let totalSpent = $derived(
    Math.abs(btcTransactions
      .filter(tx => {
        const cat = tx.category || "Uncategorized";
        if (EXPENSE_CATEGORIES.includes(cat) && tx.amount_sats < 0) return true;
        if (cat === "Gift" && tx.amount_sats < 0) return true;
        return false;
      })
      .reduce((sum, tx) => sum + tx.amount_sats, 0))
  );

  // Flow = Income - Spent
  let totalFlow = $derived(totalIncome - totalSpent);

  // Filtered balance (BTC only)
  let filteredBalance = $derived(
    btcTransactions.reduce((sum, tx) => sum + tx.amount_sats, 0)
  );

  // Total fees paid
  let totalFees = $derived.by(() => {
    let btcFees = 0;
    let fiatFees: Record<string, number> = {};
    
    for (const tx of filteredTransactions) {
      if (tx.fee_sats && tx.fee_sats > 0) {
        btcFees += tx.fee_sats;
      }
      if (tx.fee_fiat && tx.fee_fiat > 0 && tx.fee_fiat_currency) {
        fiatFees[tx.fee_fiat_currency] = (fiatFees[tx.fee_fiat_currency] || 0) + tx.fee_fiat;
      }
    }
    
    return { btcFees, fiatFees };
  });

  // Fiat holdings per currency
  let fiatHoldings = $derived.by(() => {
    const holdings: Record<string, number> = {};
    
    for (const tx of filteredTransactions) {
      const currency = tx.currency || 'BTC';
      if (currency !== 'BTC') {
        holdings[currency] = (holdings[currency] || 0) + tx.amount_sats;
      }
    }
    
    for (const currency in holdings) {
      holdings[currency] = holdings[currency] / 100;
    }
    
    return holdings;
  });

  // P&L Categories
  const ACQUISITION_CATEGORIES = [
    "Buy", "Income", "Mining", "Gift", "Trading Gain", "Lending Interest (Income)"
  ];
  
  const DISPOSAL_CATEGORIES = [
    "Sell", "Food", "Utilities", "Shopping", "Trading Loss", "Liquidation"
  ];
  
  const PNL_EXCLUDED_CATEGORIES = [
    "Transfer In", "Transfer Out", "Receive Loan", "Repay Loan", "Uncategorized"
  ];

  // P&L Calculations
  let pnlData = $derived.by(() => {
    if (!currentFiatPrice) {
      return { 
        unrealized: { fiat: 0, percent: 0 }, 
        realized: { fiat: 0, percent: 0 }, 
        total: { fiat: 0, percent: 0 },
        totalCostBasis: 0,
        totalProceeds: 0
      };
    }
    
    const sorted = [...btcTransactions]
      .filter(tx => tx.timestamp && tx.fiat_value !== null)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    
    const acquisitions: { sats: number; fiatValue: number; timestamp: number }[] = [];
    const disposals: { sats: number; fiatValue: number; timestamp: number }[] = [];
    
    for (const tx of sorted) {
      const category = tx.category || "Uncategorized";
      
      if (PNL_EXCLUDED_CATEGORIES.includes(category)) continue;
      
      if (tx.amount_sats > 0 && ACQUISITION_CATEGORIES.includes(category)) {
        acquisitions.push({
          sats: tx.amount_sats,
          fiatValue: Math.abs(tx.fiat_value!),
          timestamp: tx.timestamp!
        });
      } else if (tx.amount_sats < 0 && DISPOSAL_CATEGORIES.includes(category)) {
        disposals.push({
          sats: Math.abs(tx.amount_sats),
          fiatValue: Math.abs(tx.fiat_value!),
          timestamp: tx.timestamp!
        });
      } else if (tx.amount_sats < 0 && category === "Gift") {
        disposals.push({
          sats: Math.abs(tx.amount_sats),
          fiatValue: Math.abs(tx.fiat_value!),
          timestamp: tx.timestamp!
        });
      } else if (tx.amount_sats > 0 && category === "Gift") {
        acquisitions.push({
          sats: tx.amount_sats,
          fiatValue: Math.abs(tx.fiat_value!),
          timestamp: tx.timestamp!
        });
      }
    }
    
    let realizedPnL = 0;
    let totalCostBasisUsed = 0;
    let totalProceeds = 0;
    let remainingLots = [...acquisitions];
    
    if (costBasisMethod === "fifo") {
      for (const disposal of disposals) {
        let satsToDispose = disposal.sats;
        totalProceeds += disposal.fiatValue;
        
        while (satsToDispose > 0 && remainingLots.length > 0) {
          const lot = remainingLots[0];
          
          if (lot.sats <= satsToDispose) {
            const costBasis = lot.fiatValue;
            const proportion = lot.sats / disposal.sats;
            const proceeds = disposal.fiatValue * proportion;
            realizedPnL += proceeds - costBasis;
            totalCostBasisUsed += costBasis;
            satsToDispose -= lot.sats;
            remainingLots.shift();
          } else {
            const proportion = satsToDispose / lot.sats;
            const costBasis = lot.fiatValue * proportion;
            const proceedsProportion = satsToDispose / disposal.sats;
            const proceeds = disposal.fiatValue * proceedsProportion;
            realizedPnL += proceeds - costBasis;
            totalCostBasisUsed += costBasis;
            lot.sats -= satsToDispose;
            lot.fiatValue -= costBasis;
            satsToDispose = 0;
          }
        }
      }
    } else {
      let totalAcquiredSats = acquisitions.reduce((sum, a) => sum + a.sats, 0);
      let totalAcquiredCost = acquisitions.reduce((sum, a) => sum + a.fiatValue, 0);
      const avgCostPerSat = totalAcquiredSats > 0 ? totalAcquiredCost / totalAcquiredSats : 0;
      
      for (const disposal of disposals) {
        const costBasis = disposal.sats * avgCostPerSat;
        realizedPnL += disposal.fiatValue - costBasis;
        totalCostBasisUsed += costBasis;
        totalProceeds += disposal.fiatValue;
      }
      
      const totalDisposedSats = disposals.reduce((sum, d) => sum + d.sats, 0);
      const remainingSats = totalAcquiredSats - totalDisposedSats;
      const remainingCostBasis = remainingSats * avgCostPerSat;
      
      remainingLots = remainingSats > 0 ? [{ 
        sats: remainingSats, 
        fiatValue: remainingCostBasis, 
        timestamp: 0 
      }] : [];
    }
    
    const remainingSats = remainingLots.reduce((sum, lot) => sum + lot.sats, 0);
    const remainingCostBasis = remainingLots.reduce((sum, lot) => sum + lot.fiatValue, 0);
    const currentValue = (remainingSats / 100_000_000) * currentFiatPrice;
    const unrealizedPnL = currentValue - remainingCostBasis;
    
    const unrealizedPercent = remainingCostBasis > 0 ? (unrealizedPnL / remainingCostBasis) * 100 : 0;
    const realizedPercent = totalCostBasisUsed > 0 ? (realizedPnL / totalCostBasisUsed) * 100 : 0;
    const totalPnL = unrealizedPnL + realizedPnL;
    const totalCostBasis = remainingCostBasis + totalCostBasisUsed;
    const totalPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
    
    return {
      unrealized: { fiat: unrealizedPnL, percent: unrealizedPercent },
      realized: { fiat: realizedPnL, percent: realizedPercent },
      total: { fiat: totalPnL, percent: totalPercent },
      totalCostBasis,
      totalProceeds
    };
  });

  // Holdings by wallet for pie chart
  let walletHoldings = $derived.by(() => {
    const walletColors = [
      "#f7931a", "#4ade80", "#38bdf8", "#a78bfa", "#f472b6",
      "#fb923c", "#fbbf24", "#60a5fa", "#34d399", "#f87171"
    ];
    
    return getFilteredWallets()
      .map((w, i) => ({
        label: w.name,
        value: balances[w.id] ?? 0,
        color: walletColors[i % walletColors.length]
      }))
      .filter(w => w.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  // Cumulative balance history
  let balanceHistory = $derived.by(() => {
    if (btcTransactions.length === 0) return [];
    
    const sorted = [...btcTransactions].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    
    const monthlyData: Record<string, number> = {};
    let cumulative = 0;
    
    for (const tx of sorted) {
      if (!tx.timestamp) continue;
      const date = new Date(tx.timestamp * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      cumulative += tx.amount_sats;
      monthlyData[key] = cumulative;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        return {
          label: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
          value
        };
      });
  });

  // Group wallets by entity type, then by entity
  let walletsByTypeAndEntity = $derived.by(() => {
    const types = ['personal', 'family', 'business'];
    
    const result: Record<string, {
      totalBalance: number;
      entities: {
        entity: Entity;
        wallets: WalletData[];
        totalBalance: number;
      }[];
    }> = {};
    
    for (const type of types) {
      const typeEntities = entities.filter(e => e.entity_type === type);
      const entitiesWithWallets = typeEntities.map(entity => {
        const entityWallets = wallets
          .filter(w => w.entity_id === entity.id)
          .sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0)); // Sort by balance desc
        
        const totalBalance = entityWallets.reduce((sum, w) => sum + (balances[w.id] ?? 0), 0);
        
        return {
          entity,
          wallets: entityWallets,
          totalBalance
        };
      }).sort((a, b) => b.totalBalance - a.totalBalance); // Sort entities by balance desc
      
      const typeTotalBalance = entitiesWithWallets.reduce((sum, e) => sum + e.totalBalance, 0);
      
      result[type] = {
        totalBalance: typeTotalBalance,
        entities: entitiesWithWallets
      };
    }
    
    return result;
  });

  // Helpers

  function formatTxId(txid: string): string {
    if (txid.startsWith("manual-")) {
      return "manual";
    }
    if (txid.startsWith("lnm-futures-")) {
      return "lnm-fut";
    }
    if (txid.startsWith("lnm-options-")) {
      return "lnm-opt";
    }
    if (txid.startsWith("phoenix-")) {
      return "phoenix";
    }
    if (txid.startsWith("bitstack-")) {
      return "bitstack";
    }
    if (txid.startsWith("bull-")) {
      return "bull";
    }
    // On-chain txid - show first 6 chars
    return txid.slice(0, 8) + "...";
  }

  function getTxLink(tx: TransactionWithDetails): string | null {
    // Only on-chain transactions have mempool links
    if (tx.txid.startsWith("manual-") || 
        tx.txid.startsWith("lnm-") || 
        tx.txid.startsWith("phoenix-") ||
        tx.txid.startsWith("bitstack-") ||
        tx.txid.startsWith("bull-")) {
      return null;
    }
    return `https://mempool.space/tx/${tx.txid}`;
  }
  function toggleTypeCollapse(type: string) {
    collapsedTypes[type] = !collapsedTypes[type];
  }

  function toggleEntityCollapse(entityId: number) {
    collapsedEntities[entityId] = !collapsedEntities[entityId];
  }

  function isTypeCollapsed(type: string): boolean {
    return collapsedTypes[type] ?? true;
  }

  function isEntityCollapsed(entityId: number): boolean {
    return collapsedEntities[entityId] ?? true;
  }

  function openAddWalletForEntity(entityId: number) {
    walletEntityId = entityId;
    showAddWallet = true;
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'personal': return 'Personal';
      case 'family': return 'Family';
      case 'business': return 'Business';
      default: return type;
    }
  }


  function showMessage(msg: string, type: "info" | "success" | "error" = "info") {
    message = msg;
    messageType = type;
    setTimeout(() => { message = ""; }, 3000);
  }

  function formatPnL(pnl: { fiat: number; percent: number }): string {
    const symbol = fiatCurrency === "EUR" ? "€" : "$";
    const sign = pnl.fiat >= 0 ? "+" : "";
    const fiatStr = sign + symbol + Math.abs(pnl.fiat).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    const percentStr = sign + pnl.percent.toFixed(1) + "%";
    return `${fiatStr} (${percentStr})`;
  }

  function formatSats(sats: number, showPlus: boolean = false): string {
    const sign = sats > 0 && showPlus ? "+" : (sats < 0 ? "-" : "");
    const absValue = Math.abs(sats);
    
    if (currencyFormat === "btc") {
      return "₿ " + sign + (absValue / 100_000_000).toFixed(8);
    } else {
      return "丰 " + sign + absValue.toLocaleString();
    }
  }

  function formatAmount(tx: TransactionWithDetails, showPlus: boolean = false): string {
    const currency = tx.currency || 'BTC';
    
    if (currency === 'BTC') {
      return formatSats(tx.amount_sats, showPlus);
    } else {
      const amount = tx.amount_sats / 100;
      const sign = amount > 0 && showPlus ? "+" : (amount < 0 ? "-" : "");
      const symbol = currency === 'EUR' ? '€' : '$';
      return symbol + " " + sign + Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  function formatDate(timestamp: number | null): string {
    if (!timestamp) return "Pending";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  function formatTime(timestamp: number | null): string {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
  }

  function getTotalBalance(): number {
    if (selectedWalletId !== null) {
      return balances[selectedWalletId] ?? 0;
    }
    const filteredWallets = selectedEntityId 
      ? wallets.filter(w => w.entity_id === selectedEntityId) : wallets;
    return filteredWallets.reduce((sum, w) => sum + (balances[w.id] ?? 0), 0);
  }

  function getFilteredWallets(): WalletData[] {
    if (selectedWalletId !== null) {
      return wallets.filter(w => w.id === selectedWalletId);
    }
    if (!selectedEntityId) return wallets;
    return wallets.filter(w => w.entity_id === selectedEntityId);
  }

  function getEntityOwners(): Entity[] {
    return entities.filter(e => e.entity_type === "personal" || e.entity_type === "family");
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
  }

  function getSortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function clearFilters() {
    filterYear = null;
    filterMonth = null;
  }

  function isManualTransaction(tx: TransactionWithDetails): boolean {
    return tx.txid.startsWith("manual-");
  }

  function openDuplicateTransaction(tx: TransactionWithDetails) {
    duplicatingTx = tx;
    
    // Pre-fill the add transaction form with duplicated values
    txType = tx.amount_sats >= 0 ? "incoming" : "outgoing";
    txCurrency = (tx.currency as "BTC" | "EUR" | "USD") || "BTC";
    
    if (txCurrency === 'BTC') {
      txAmount = Math.abs(tx.amount_sats).toString();
    } else {
      txAmount = (Math.abs(tx.amount_sats) / 100).toString();
    }
    
    txWalletId = tx.wallet_id;
    txCategory = tx.category || "Uncategorized";
    txNote = tx.note ? `${tx.note} (copy)` : "(copy)";
    txDate = tx.timestamp 
      ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    txFiatValue = tx.fiat_value ? Math.abs(tx.fiat_value).toString() : "";
    txFeeSats = tx.fee_sats ? tx.fee_sats.toString() : "";
    txFeeFiat = tx.fee_fiat ? tx.fee_fiat.toString() : "";
    
    showDuplicateTransaction = true;
  }

  async function saveDuplicateTransaction() {
    // Reuse the add manual transaction logic
    await addManualTransaction();
    showDuplicateTransaction = false;
    duplicatingTx = null;
  }

  function closeDuplicateModal() {
    showDuplicateTransaction = false;
    duplicatingTx = null;
    // Reset form
    txAmount = "";
    txNote = "";
    txFiatValue = "";
    txCategory = "Uncategorized";
    txDate = new Date().toISOString().split('T')[0];
    txCurrency = "BTC";
    txFeeSats = "";
    txFeeFiat = "";
  }

  function formatFiat(fiatValue: number | null): string {
    if (fiatValue === null) return "—";
    const symbol = fiatCurrency === "EUR" ? "€ " : "$ ";
    return symbol + Math.abs(fiatValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatBalanceFiat(sats: number): string {
    if (!currentFiatPrice) return "";
    const btc = sats / 100_000_000;
    const fiat = btc * currentFiatPrice;
    const symbol = fiatCurrency === "EUR" ? "€" : "$";
    return symbol + fiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getPriceChange(): { value: number; percent: number } | null {
    if (!currentFiatPrice || !dayOpenPrice) return null;
    const value = currentFiatPrice - dayOpenPrice;
    const percent = (value / dayOpenPrice) * 100;
    return { value, percent };
  }

  function formatPriceChange(): string {
    const change = getPriceChange();
    if (!change) return "";
    const symbol = fiatCurrency === "EUR" ? "€" : "$";
    const sign = change.value >= 0 ? "+" : "";
    return `${sign}${symbol}${Math.abs(change.value).toFixed(0)} (${sign}${change.percent.toFixed(2)}%)`;
  }

  function formatImportDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  // Data loading
  async function loadEntities() {
    try { entities = await invoke("get_entities"); } 
    catch (e) { showMessage(`${e}`, "error"); }
  }

  async function loadWallets() {
    try { wallets = await invoke("get_wallets"); await loadBalances(); } 
    catch (e) { showMessage(`${e}`, "error"); }
  }

  async function loadBalances() {
    try { balances = await invoke("get_wallet_balances"); } 
    catch (e) { console.error("Failed to load balances:", e); }
  }

  async function loadSettings() {
    try {
      const format = await invoke("get_setting", { key: "currency_format" });
      if (format) currencyFormat = format as CurrencyFormat;
    } catch (e) { console.error("Failed to load settings:", e); }
  }

  async function loadCategories() {
    try {
      categories = await invoke("get_categories");
    } catch (e) {
      console.error("Failed to load categories:", e);
      // Fallback to defaults if DB not ready
      categories = [
        { id: 1, name: "Uncategorized", is_system: true },
        { id: 2, name: "Buy", is_system: true },
        { id: 3, name: "Sell", is_system: true },
        { id: 4, name: "Transfer In", is_system: true },
        { id: 5, name: "Transfer Out", is_system: true },
      ];
    }
  }

  async function addNewCategory() {
    if (!newCategoryName.trim()) {
      showMessage("Please enter a category name", "error");
      return;
    }
    
    try {
      await invoke("add_category", { name: newCategoryName.trim() });
      showMessage(`Category "${newCategoryName}" added`, "success");
      newCategoryName = "";
      showAddCategory = false;
      await loadCategories();
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  function openEditCategory(category: Category) {
    if (category.is_system) {
      showMessage("Cannot edit system categories", "error");
      return;
    }
    editingCategory = category;
    editCategoryName = category.name;
    showEditCategory = true;
  }

  async function saveEditCategory() {
    if (!editingCategory || !editCategoryName.trim()) {
      showMessage("Please enter a category name", "error");
      return;
    }
    
    try {
      await invoke("update_category", { 
        id: editingCategory.id, 
        name: editCategoryName.trim() 
      });
      showMessage("Category updated", "success");
      showEditCategory = false;
      editingCategory = null;
      await loadCategories();
      await loadTransactions(); // Refresh transactions to show updated category names
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  function openDeleteCategory(category: Category) {
    if (category.is_system) {
      showMessage("Cannot delete system categories", "error");
      return;
    }
    categoryToDelete = category;
    showDeleteCategory = true;
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    
    try {
      await invoke("delete_category", { id: categoryToDelete.id });
      showMessage("Category deleted", "success");
      showDeleteCategory = false;
      categoryToDelete = null;
      await loadCategories();
      await loadTransactions(); // Refresh transactions
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  async function setCurrencyFormat(format: CurrencyFormat) {
    currencyFormat = format;
    try { await invoke("set_setting", { key: "currency_format", value: format }); } 
    catch (e) { showMessage(`${e}`, "error"); }
  }

  async function loadFiatSettings(): Promise<void> {
    try {
      const enabled = await invoke("get_setting", { key: "fiat_enabled" });
      fiatEnabled = enabled === "true";
      
      const currency = await invoke("get_setting", { key: "fiat_currency" });
      if (currency === "USD" || currency === "EUR") {
        fiatCurrency = currency;
      }
      
      const method = await invoke("get_setting", { key: "cost_basis_method" });
      if (method === "average" || method === "fifo") {
        costBasisMethod = method;
      }
    } catch (e) {
      console.error("Failed to load fiat settings:", e);
    }
  }

  async function setCostBasisMethod(method: "average" | "fifo") {
    costBasisMethod = method;
    try {
      await invoke("set_setting", { key: "cost_basis_method", value: method });
      showMessage(`Cost basis method set to ${method === "average" ? "Average Cost" : "FIFO"}`, "success");
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  async function setFiatEnabled(enabled: boolean) {
    fiatEnabled = enabled;
    try {
      await invoke("set_setting", { key: "fiat_enabled", value: enabled ? "true" : "false" });
      if (enabled && !currentFiatPrice) {
        await fetchCurrentPrice();
      }
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  async function setFiatCurrency(currency: "EUR" | "USD") {
    if (currency === fiatCurrency) return;
    
    const txsWithFiat = transactions.filter(tx => tx.fiat_value !== null);
    
    if (txsWithFiat.length > 0) {
      pendingFiatCurrency = currency;
      showFiatChangeConfirm = true;
    } else {
      await applyFiatCurrencyChange(currency, false);
    }
  }

  async function applyFiatCurrencyChange(currency: "EUR" | "USD", updateHistory: boolean) {
    const oldCurrency = fiatCurrency;
    fiatCurrency = currency;
    currentFiatPrice = null;
    dayOpenPrice = null;
    showFiatChangeConfirm = false;
    pendingFiatCurrency = null;
    
    try {
      await invoke("set_setting", { key: "fiat_currency", value: currency });
      await fetchCurrentPrice();
      
      if (updateHistory) {
        await clearTransactionFiatValues();
        await loadTransactions();
        await updateTransactionsFiatValues();
      }
      
      showMessage(`Currency changed to ${currency}`, "success");
    } catch (e) {
      fiatCurrency = oldCurrency;
      showMessage(`Failed to change currency: ${e}`, "error");
    }
  }

  async function clearTransactionFiatValues() {
    for (const tx of transactions) {
      if (tx.fiat_value !== null) {
        try {
          await invoke("update_transaction_fiat", {
            id: tx.id,
            fiatValue: null,
            fiatCurrency: null
          });
        } catch (e) {
          console.error("Failed to clear fiat value:", e);
        }
      }
    }
  }

  function cancelFiatCurrencyChange() {
    showFiatChangeConfirm = false;
    pendingFiatCurrency = null;
  }

  async function fetchCurrentPrice() {
    priceLoading = true;
    try {
      const price: number = await invoke("fetch_current_price", { currency: fiatCurrency.toLowerCase() });
      currentFiatPrice = price;
      priceLastUpdated = new Date();
      await invoke("cache_price", { currency: fiatCurrency, price, date: "current" });
      
      // Fetch day open price (00:00 UTC today)
      await fetchDayOpenPrice();
      
      showMessage(`Price updated: ${fiatCurrency === "EUR" ? "€" : "$"}${price.toLocaleString()}`, "success");
    } catch (e) {
      showMessage(`Failed to fetch price: ${e}`, "error");
    }
    priceLoading = false;
  }

  async function fetchDayOpenPrice() {
    try {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
      
      // Check cache first
      const cacheKey = `${fiatCurrency}-dayopen`;
      const cached: number | null = await invoke("get_cached_price", { currency: fiatCurrency, date: cacheKey });
      
      if (cached) {
        dayOpenPrice = cached;
        return;
      }
      
      // Fetch historical price for today (returns day open)
      const price: number = await invoke("fetch_historical_price", { currency: fiatCurrency.toLowerCase(), date: dateStr });
      dayOpenPrice = price;
      
      // Cache it
      await invoke("cache_price", { currency: fiatCurrency, price, date: cacheKey });
    } catch (e) {
      console.error("Failed to fetch day open price:", e);
      dayOpenPrice = null;
    }
  }

  async function loadCachedCurrentPrice() {
    try {
      const cached: number | null = await invoke("get_cached_price", { currency: fiatCurrency, date: "current" });
      if (cached) {
        currentFiatPrice = cached;
      }
      
      // Also load cached day open
      const cacheKey = `${fiatCurrency}-dayopen`;
      const cachedDayOpen: number | null = await invoke("get_cached_price", { currency: fiatCurrency, date: cacheKey });
      if (cachedDayOpen) {
        dayOpenPrice = cachedDayOpen;
      }
    } catch (e) {
      console.error("Failed to load cached price:", e);
    }
  }

  async function fetchHistoricalPriceForDate(timestamp: number): Promise<number | null> {
    const date = new Date(timestamp * 1000);
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    
    // Check cache first
    try {
      const cached: number | null = await invoke("get_cached_price", { currency: fiatCurrency, date: dateStr });
      if (cached) return cached;
    } catch (e) {
      console.error("Cache check failed:", e);
    }
    
    // Fetch from API - let errors propagate for rate limit handling
    const price: number = await invoke("fetch_historical_price", { currency: fiatCurrency.toLowerCase(), date: dateStr });
    await invoke("cache_price", { currency: fiatCurrency, price, date: dateStr });
    return price;
  }

  async function updateTransactionsFiatValues() {
    const txsNeedingFiat = transactions.filter(tx => tx.fiat_value === null && tx.timestamp && (tx.currency || 'BTC') === 'BTC');
    if (txsNeedingFiat.length === 0) {
      showMessage("All transactions have fiat values", "info");
      return;
    }
    
    fetchingFiatValues = true;
    showMessage(`Fetching fiat values for ${txsNeedingFiat.length} transactions...`, "info");
    
    // Group by date to minimize API calls
    const byDate: Record<string, TransactionWithDetails[]> = {};
    for (const tx of txsNeedingFiat) {
      if (!tx.timestamp) continue;
      const date = new Date(tx.timestamp * 1000);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(tx);
    }
    
    const dateEntries = Object.entries(byDate);
    let updated = 0;
    let totalDates = dateEntries.length;
    let processedDates = 0;
    
    for (const [dateKey, txs] of dateEntries) {
      const tx = txs[0];
      if (!tx.timestamp) continue;
      
      let price: number | null = null;
      let retries = 0;
      const maxRetries = 5;
      
      // Retry loop with exponential backoff for rate limiting
      while (price === null && retries < maxRetries) {
        try {
          price = await fetchHistoricalPriceForDate(tx.timestamp);
          
          if (price === null) {
            retries++;
            if (retries < maxRetries) {
              // Exponential backoff: 5s, 10s, 20s, 40s, 80s
              const waitTime = 5000 * Math.pow(2, retries - 1);
              showMessage(`Rate limited. Waiting ${waitTime / 1000}s before retry (${retries}/${maxRetries})...`, "info");
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        } catch (e: any) {
          const errorStr = String(e).toLowerCase();
          
          // Check if it's a rate limit error
          if (errorStr.includes('429') || errorStr.includes('rate') || errorStr.includes('limit') || errorStr.includes('too many')) {
            retries++;
            if (retries < maxRetries) {
              // Exponential backoff: 10s, 20s, 40s, 80s, 160s
              const waitTime = 10000 * Math.pow(2, retries - 1);
              showMessage(`Rate limited. Waiting ${waitTime / 1000}s before retry (${retries}/${maxRetries})...`, "info");
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.error(`Failed to fetch price after ${maxRetries} retries:`, e);
            }
          } else {
            // Not a rate limit error, don't retry
            console.error("Failed to fetch price:", e);
            break;
          }
        }
      }
      
      if (price === null) {
        console.warn(`Skipping date ${dateKey} after ${retries} retries`);
        processedDates++;
        continue;
      }
      
      // Update all transactions for this date
      for (const t of txs) {
        const btc = Math.abs(t.amount_sats) / 100_000_000;
        const fiatValue = btc * price;
        
        try {
          await invoke("update_transaction_fiat", {
            id: t.id,
            fiatValue: t.amount_sats >= 0 ? fiatValue : -fiatValue,
            fiatCurrency: fiatCurrency
          });
          t.fiat_value = t.amount_sats >= 0 ? fiatValue : -fiatValue;
          t.fiat_currency = fiatCurrency;
          updated++;
        } catch (e) {
          console.error("Failed to update tx fiat:", e);
        }
      }
      
      processedDates++;
      
      // Progress update every 5 dates
      if (processedDates % 5 === 0) {
        showMessage(`Progress: ${processedDates}/${totalDates} dates processed (${updated} transactions updated)`, "info");
      }
      
      // Standard delay between successful requests to avoid hitting rate limit
      // Coingecko free tier: ~10-30 calls/min, so 3s delay = 20 calls/min
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    fetchingFiatValues = false;
    
    if (updated > 0) {
      showMessage(`Done! Updated fiat values for ${updated} transactions`, "success");
    } else {
      showMessage("No fiat values could be fetched. API may be unavailable.", "error");
    }
  }

  function openImportCSV() {
    importStep = "upload";
    importFile = null;
    importWalletId = wallets[0]?.id || 0;
    importParserName = "";
    importTransactions = [];
    importErrors = [];
    importWarnings = [];
    importResult = null;
    showImportCSV = true;
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    importFile = input.files[0];
    const content = await importFile.text();
    
    const { headers, rows } = parseCSV(content);
    
    if (headers.length === 0) {
      importErrors = ["Could not parse CSV file"];
      return;
    }
    
    const parser = detectParser(headers);
    
    if (!parser) {
      importErrors = ["Unknown CSV format. Supported formats: Phoenix, Bitstack, Bull Bitcoin"];
      return;
    }
    
    importParserName = parser.name;
    const result = parser.parse(headers, rows);
    
    importTransactions = result.transactions;
    importErrors = result.errors;
    importWarnings = result.warnings;
    importStep = "preview";
  }

  async function executeImport() {
    if (!importWalletId || importTransactions.length === 0) return;
    
    importStep = "importing";
    
    try {
      const txsToImport = importTransactions.map(tx => ({
        id: tx.id,
        timestamp: tx.timestamp,
        amount_sats: tx.amount_sats,
        fee_sats: tx.fee_sats,
        fee_fiat: tx.fee_fiat,
        fee_fiat_currency: tx.fee_fiat_currency,
        category: tx.category === "Uncategorized" ? null : tx.category,
        note: tx.note || null,
        fiat_value: tx.fiat_value,
        fiat_currency: tx.fiat_currency,
        currency: tx.currency,
      }));
      
      const result: { imported: number; skipped: number; errors: string[] } = await invoke("import_transactions", {
        walletId: importWalletId,
        transactions: txsToImport,
      });
      
      importResult = result;
      importStep = "done";
      
      await loadTransactions();
      await loadBalances();
      
    } catch (e) {
      importErrors = [`Import failed: ${e}`];
      importStep = "preview";
    }
  }

  function closeImport() {
    showImportCSV = false;
    importStep = "upload";
    importFile = null;
    importTransactions = [];
    importErrors = [];
    importWarnings = [];
    importResult = null;
  }

  async function loadTransactions() {
    loadingTxs = true;
    try { transactions = await invoke("get_all_transactions", { entityId: selectedEntityId }); } 
    catch (e) { showMessage(`${e}`, "error"); }
    loadingTxs = false;
  }

  async function addEntity() {
    if (!newEntityName.trim()) { showMessage("Please enter a name", "error"); return; }
    try {
      if (entityModalType === "family") {
        await invoke("add_family_member", { name: newEntityName.trim() });
      } else {
        await invoke("add_business", { name: newEntityName.trim(), parentId: newBusinessParent });
      }
      showMessage(`Added "${newEntityName}"`, "success");
      newEntityName = ""; newBusinessParent = null; showAddEntity = false;
      await loadEntities();
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  function openDeleteEntity(entity: Entity) {
    entityToDelete = entity;
    showDeleteEntity = true;
  }

  async function confirmDeleteEntity() {
    if (!entityToDelete) return;
    try {
      await invoke("delete_entity", { id: entityToDelete.id });
      showMessage("Deleted", "success");
      if (selectedEntityId === entityToDelete.id) selectedEntityId = null;
      showDeleteEntity = false; entityToDelete = null;
      await loadEntities(); await loadWallets();
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  async function addWallet() {
    if (!walletName) { 
      showMessage("Please enter a wallet name", "error"); 
      return; 
    }
    if (!walletIsManual && !walletXpub) { 
      showMessage("Please enter an extended public key or select Manual", "error"); 
      return; 
    }
    try {
      await invoke("add_wallet", { 
        name: walletName, 
        xpub: walletIsManual ? null : walletXpub, 
        walletType: walletIsManual ? "manual" : walletType, 
        entityId: walletEntityId 
      });
      showMessage(`Wallet added`, "success");
      walletName = ""; 
      walletXpub = ""; 
      walletIsManual = false;
      showAddWallet = false;
      await loadWallets();
    } catch (e) { 
      showMessage(`${e}`, "error"); 
    }
  }

  function openDeleteWallet(wallet: WalletData) {
    walletToDelete = wallet;
    showDeleteWallet = true;
  }

  async function confirmDeleteWallet() {
    if (!walletToDelete) return;
    try {
      await invoke("delete_wallet", { id: walletToDelete.id });
      showMessage("Wallet deleted", "success");
      showDeleteWallet = false; walletToDelete = null;
      await loadWallets(); await loadTransactions();
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  function openEditWallet(wallet: WalletData) {
    walletToEdit = wallet;
    editWalletName = wallet.name;
    editWalletEntityId = wallet.entity_id;
    showEditWallet = true;
  }

  async function saveEditWallet() {
    if (!walletToEdit || !editWalletName.trim()) { showMessage("Please enter a name", "error"); return; }
    try {
      await invoke("update_wallet", { id: walletToEdit.id, name: editWalletName.trim(), entityId: editWalletEntityId });
      showMessage("Wallet updated", "success");
      showEditWallet = false; walletToEdit = null;
      await loadWallets();
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  async function syncWalletTransactions(wallet: WalletData) {
    syncingWallet = wallet.id;
    try {
      const fetched: Transaction[] = await invoke("fetch_wallet_transactions", { xpub: wallet.xpub });
      await invoke("save_transactions", { walletId: wallet.id, transactions: fetched });
      showMessage(`Synced ${fetched.length} transactions`, "success");
      await loadTransactions();
      await loadBalances();
      
      if (fiatEnabled) {
        await updateTransactionsFiatValues();
      }
    } catch (e) {
      showMessage(`${e}`, "error");
    }
    syncingWallet = null;
  }

  async function updateCategory(tx: TransactionWithDetails, category: string) {
    try {
      await invoke("update_transaction", { id: tx.id, category: category === "Uncategorized" ? null : category, note: tx.note });
      tx.category = category === "Uncategorized" ? null : category;
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  async function updateNote(tx: TransactionWithDetails, note: string) {
    try {
      await invoke("update_transaction", { id: tx.id, category: tx.category, note: note || null });
      tx.note = note || null;
    } catch (e) { showMessage(`${e}`, "error"); }
  }

  async function addManualTransaction() {
    if (!txAmount || !txWalletId) {
      showMessage("Please fill in amount and select a wallet", "error");
      return;
    }
    
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage("Please enter a valid amount", "error");
      return;
    }
    
    let amountSats: number;
    if (txCurrency === 'BTC') {
      amountSats = Math.round(amountNum * (txAmount.includes(".") ? 100_000_000 : 1));
    } else {
      amountSats = Math.round(amountNum * 100);
    }
    
    const finalAmount = txType === "outgoing" ? -amountSats : amountSats;
    const timestamp = Math.floor(new Date(txDate).getTime() / 1000);
    
    let fiatValue: number | null = null;
    if (txFiatValue) {
      const fiatNum = parseFloat(txFiatValue);
      if (!isNaN(fiatNum)) {
        fiatValue = txType === "outgoing" ? -fiatNum : fiatNum;
      }
    }
    
    let feeSats: number | null = null;
    let feeFiat: number | null = null;
    let feeFiatCurrency: string | null = null;
    
    if (txFeeSats) {
      const feeNum = parseFloat(txFeeSats);
      if (!isNaN(feeNum) && feeNum > 0) {
        feeSats = Math.round(feeNum);
      }
    }
    
    if (txFeeFiat) {
      const feeNum = parseFloat(txFeeFiat);
      if (!isNaN(feeNum) && feeNum > 0) {
        feeFiat = feeNum;
        feeFiatCurrency = fiatCurrency;
      }
    }
    
    try {
      await invoke("add_manual_transaction", {
        walletId: txWalletId,
        amountSats: finalAmount,
        timestamp,
        category: txCategory === "Uncategorized" ? null : txCategory,
        note: txNote || null,
        fiatValue,
        fiatCurrency: fiatValue ? fiatCurrency : null,
        currency: txCurrency,
        feeSats,
        feeFiat,
        feeFiatCurrency,
      });
      
      showMessage("Transaction added", "success");
      showAddTransaction = false;
      
      txAmount = "";
      txNote = "";
      txFiatValue = "";
      txCategory = "Uncategorized";
      txDate = new Date().toISOString().split('T')[0];
      txCurrency = "BTC";
      txFeeSats = "";
      txFeeFiat = "";
      
      await loadTransactions();
      await loadBalances();
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  function openEditTransaction(tx: TransactionWithDetails) {
    if (!isManualTransaction(tx)) {
      showMessage("Only manual transactions can be edited", "error");
      return;
    }
    editingTx = tx;
    editTxType = tx.amount_sats >= 0 ? "incoming" : "outgoing";
    editTxCurrency = (tx.currency as "BTC" | "EUR" | "USD") || "BTC";
    
    if (editTxCurrency === 'BTC') {
      editTxAmount = Math.abs(tx.amount_sats).toString();
    } else {
      editTxAmount = (Math.abs(tx.amount_sats) / 100).toString();
    }
    
    editTxCategory = tx.category || "Uncategorized";
    editTxNote = tx.note || "";
    editTxDate = tx.timestamp 
      ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    editTxFiatValue = tx.fiat_value ? Math.abs(tx.fiat_value).toString() : "";
    editTxFeeSats = tx.fee_sats ? tx.fee_sats.toString() : "";
    editTxFeeFiat = tx.fee_fiat ? tx.fee_fiat.toString() : "";
    showEditTransaction = true;
  }

  async function saveEditTransaction() {
    if (!editingTx || !editTxAmount) {
      showMessage("Please fill in amount", "error");
      return;
    }
    
    const amountNum = parseFloat(editTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage("Please enter a valid amount", "error");
      return;
    }
    
    let amountSats: number;
    if (editTxCurrency === 'BTC') {
      amountSats = Math.round(amountNum * (editTxAmount.includes(".") ? 100_000_000 : 1));
    } else {
      amountSats = Math.round(amountNum * 100);
    }
    
    const finalAmount = editTxType === "outgoing" ? -amountSats : amountSats;
    const timestamp = Math.floor(new Date(editTxDate).getTime() / 1000);
    
    let fiatValue: number | null = null;
    if (editTxFiatValue) {
      const fiatNum = parseFloat(editTxFiatValue);
      if (!isNaN(fiatNum)) {
        fiatValue = editTxType === "outgoing" ? -fiatNum : fiatNum;
      }
    }
    
    let feeSats: number | null = null;
    let feeFiat: number | null = null;
    let feeFiatCurrency: string | null = null;
    
    if (editTxFeeSats) {
      const feeNum = parseFloat(editTxFeeSats);
      if (!isNaN(feeNum) && feeNum > 0) {
        feeSats = Math.round(feeNum);
      }
    }
    
    if (editTxFeeFiat) {
      const feeNum = parseFloat(editTxFeeFiat);
      if (!isNaN(feeNum) && feeNum > 0) {
        feeFiat = feeNum;
        feeFiatCurrency = fiatCurrency;
      }
    }
    
    try {
      await invoke("update_manual_transaction", {
        id: editingTx.id,
        amountSats: finalAmount,
        timestamp,
        category: editTxCategory === "Uncategorized" ? null : editTxCategory,
        note: editTxNote || null,
        fiatValue,
        fiatCurrency: fiatValue ? fiatCurrency : null,
        currency: editTxCurrency,
        feeSats,
        feeFiat,
        feeFiatCurrency,
      });
      
      showMessage("Transaction updated", "success");
      showEditTransaction = false;
      editingTx = null;
      
      await loadTransactions();
      await loadBalances();
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  function openDeleteTransaction(tx: TransactionWithDetails) {
    if (!isManualTransaction(tx)) {
      showMessage("Only manual transactions can be deleted", "error");
      return;
    }
    txToDelete = tx;
    showDeleteTransaction = true;
  }

  async function confirmDeleteTransaction() {
    if (!txToDelete) return;
    
    try {
      await invoke("delete_transaction", { id: txToDelete.id });
      showMessage("Transaction deleted", "success");
      showDeleteTransaction = false;
      txToDelete = null;
      
      await loadTransactions();
      await loadBalances();
    } catch (e) {
      showMessage(`${e}`, "error");
    }
  }

  async function loadTheme() {
    try {
      const savedTheme = await invoke("get_setting", { key: "theme" });
      if (savedTheme === "light" || savedTheme === "dark") {
        theme = savedTheme;
        applyTheme(theme);
      }
    } catch (e) {
      console.error("Failed to load theme:", e);
    }
  }

  function applyTheme(t: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", t);
  }

  async function setTheme(t: "dark" | "light") {
  theme = t;
  applyTheme(t);
  try {
    await invoke("set_setting", { key: "theme", value: t });
  } catch (e) {
    showMessage(`${e}`, "error");
  }
  }

  async function exportAllData() {
  exportingData = true;
  try {
    // Export transactions
    const rows = [
      ["Date", "Amount (sats)", "Currency", "Fiat Value", "Fiat Currency", "Fee (sats)", "Fee (fiat)", "Fee Currency", "Category", "Note", "Wallet", "Owner", "TxID"].join(",")
    ];
    
    for (const tx of transactions) {
      const date = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : "";
      const row = [
        date,
        tx.amount_sats,
        tx.currency || "BTC",
        tx.fiat_value ?? "",
        tx.fiat_currency ?? "",
        tx.fee_sats ?? "",
        tx.fee_fiat ?? "",
        tx.fee_fiat_currency ?? "",
        tx.category ?? "",
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        tx.wallet_name,
        tx.owner_name,
        tx.txid
      ].join(",");
      rows.push(row);
    }
    
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satstone-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage("Data exported successfully", "success");
  } catch (e) {
    showMessage(`Export failed: ${e}`, "error");
  }
  exportingData = false;
  }

  // ============================================================================
  // ENCRYPTION FUNCTIONS
  // ============================================================================

  async function checkEncryptionStatus() {
    checkingEncryption = true;
    try {
      const exists = await invoke("check_db_exists");
      if (!exists) {
        // New database, no encryption yet
        dbEncrypted = false;
        appLocked = false;
      } else {
        dbEncrypted = await invoke("check_db_encrypted");
        appLocked = dbEncrypted; // Lock if encrypted
      }
    } catch (e) {
      console.error("Failed to check encryption status:", e);
      dbEncrypted = false;
      appLocked = false;
    }
    checkingEncryption = false;
  }

  async function unlockWithPassphrase() {
    if (!unlockPassphrase) {
      unlockError = "Please enter your passphrase";
      return;
    }
    
    unlockError = "";
    try {
      await invoke("unlock_with_passphrase", { passphrase: unlockPassphrase });
      appLocked = false;
      unlockPassphrase = "";
      lastActivityTime = Date.now();
    } catch (e) {
      unlockError = "Invalid passphrase. Please try again.";
    }
  }

  async function unlockWithRecovery() {
    if (!recoveryInput.trim()) {
      unlockError = "Please enter your recovery phrase";
      return;
    }
  
    unlockError = "";
    
    // Normalize the input: lowercase, replace newlines/commas with spaces, collapse multiple spaces
    const normalized = recoveryInput
      .toLowerCase()
      .trim()
      .replace(/[\n\r,]+/g, ' ')  // Replace newlines and commas with spaces
      .replace(/\s+/g, ' ')        // Collapse multiple spaces into one
      .replace(/[0-9]+\.\s*/g, '') // Remove numbering like "1. " or "2. "
      .trim();
    
    console.log("Normalized recovery phrase:", normalized);
    console.log("Word count:", normalized.split(' ').length);
    
    try {
      const isValid = await invoke("validate_recovery_phrase", { phrase: normalized });
      console.log("Validation result:", isValid);
      
      if (!isValid) {
        unlockError = "Invalid recovery phrase format. Please check spelling.";
        return;
      }
      
      await invoke("unlock_with_recovery", { recoveryPhrase: normalized });
      appLocked = false;
      recoveryInput = "";
      lastActivityTime = Date.now();
    } catch (e) {
      console.error("Unlock error:", e);
      unlockError = `Failed to unlock: ${e}`;
    }
  }

  async function startEncryptionSetup() {
    encryptionStep = "passphrase";
    encryptPassphrase = "";
    encryptPassphraseConfirm = "";
    encryptRecoveryPhrase = "";
    recoveryPhraseConfirmed = false;
    passwordStrength = null;
    showEncryptionSetup = true;
  }

  async function generateRecovery() {
    try {
      encryptRecoveryPhrase = await invoke("generate_recovery_phrase");
      encryptionStep = "recovery";
    } catch (e) {
      showMessage(`Failed to generate recovery phrase: ${e}`, "error");
    }
  }

  async function checkPasswordStrength(password: string) {
    if (!password) {
      passwordStrength = null;
      return;
    }
    try {
      passwordStrength = await invoke("check_password_strength", { password });
    } catch (e) {
      console.error("Failed to check password strength:", e);
    }
  }

  async function checkNewPasswordStrength(password: string) {
    if (!password) {
      newPasswordStrength = null;
      return;
    }
    try {
      newPasswordStrength = await invoke("check_password_strength", { password });
    } catch (e) {
      console.error("Failed to check password strength:", e);
    }
  }

  async function confirmEncryption() {
    if (encryptPassphrase !== encryptPassphraseConfirm) {
      showMessage("Passphrases do not match", "error");
      return;
    }
    
    if (!recoveryPhraseConfirmed) {
      showMessage("Please confirm you have saved your recovery phrase", "error");
      return;
    }
    
    // Normalize the recovery phrase
    const normalizedRecovery = encryptRecoveryPhrase
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
    
    try {
      await invoke("encrypt_database", { 
        passphrase: encryptPassphrase, 
        recoveryPhrase: normalizedRecovery 
      });
      
      showMessage("Database encrypted successfully!", "success");
      dbEncrypted = true;
      showEncryptionSetup = false;
      
      // Reset form
      encryptPassphrase = "";
      encryptPassphraseConfirm = "";
      encryptRecoveryPhrase = "";
      recoveryPhraseConfirmed = false;
      encryptionStep = "passphrase";
    } catch (e) {
      showMessage(`Encryption failed: ${e}`, "error");
    }
  }

  function cancelEncryptionSetup() {
    showEncryptionSetup = false;
    encryptPassphrase = "";
    encryptPassphraseConfirm = "";
    encryptRecoveryPhrase = "";
    recoveryPhraseConfirmed = false;
    encryptionStep = "passphrase";
    passwordStrength = null;
  }

  async function changePassphrase() {
    if (!currentPassphrase || !newPassphrase || !newPassphraseConfirm) {
      showMessage("Please fill in all fields", "error");
      return;
    }
    
    if (newPassphrase !== newPassphraseConfirm) {
      showMessage("New passphrases do not match", "error");
      return;
    }
    
    try {
      await invoke("change_passphrase", { 
        oldPassphrase: currentPassphrase, 
        newPassphrase: newPassphrase 
      });
      
      showMessage("Passphrase changed successfully!", "success");
      showChangePassphrase = false;
      currentPassphrase = "";
      newPassphrase = "";
      newPassphraseConfirm = "";
      newPasswordStrength = null;
    } catch (e) {
      showMessage(`Failed to change passphrase: ${e}`, "error");
    }
  }

  async function removeEncryption() {
    if (!removeEncryptionPassphrase) {
      showMessage("Please enter your passphrase", "error");
      return;
    }
    
    try {
      await invoke("remove_encryption", { passphrase: removeEncryptionPassphrase });
      
      showMessage("Encryption removed successfully", "success");
      dbEncrypted = false;
      showRemoveEncryption = false;
      removeEncryptionPassphrase = "";
    } catch (e) {
      showMessage(`Failed to remove encryption: ${e}`, "error");
    }
  }

  function copyRecoveryPhrase() {
    navigator.clipboard.writeText(encryptRecoveryPhrase);
    showMessage("Recovery phrase copied to clipboard", "success");
  }

  // Auto-lock functions
  async function loadAutoLockSetting() {
    try {
      const setting = await invoke("get_setting", { key: "auto_lock" });
      if (setting) {
        autoLockTime = setting as typeof autoLockTime;
      }
    } catch (e) {
      console.error("Failed to load auto-lock setting:", e);
    }
  }

  async function setAutoLockTime(time: typeof autoLockTime) {
    autoLockTime = time;
    try {
      await invoke("set_setting", { key: "auto_lock", value: time });
    } catch (e) {
      showMessage(`Failed to save setting: ${e}`, "error");
    }
    setupAutoLock();
  }

  function setupAutoLock() {
    // Clear existing interval
    if (autoLockInterval) {
      clearInterval(autoLockInterval);
      autoLockInterval = null;
    }
    
    if (autoLockTime === "never" || !dbEncrypted) return;
    
    const lockMs = parseInt(autoLockTime) * 60 * 1000;
    
    autoLockInterval = setInterval(() => {
      if (Date.now() - lastActivityTime > lockMs && !appLocked) {
        appLocked = true;
        showMessage("App locked due to inactivity", "info");
      }
    }, 10000); // Check every 10 seconds
  }

  function resetActivityTimer() {
    lastActivityTime = Date.now();
  }

  // Track user activity
  function setupActivityTracking() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });
  }

  async function resetAllData() {
  try {
    await invoke("reset_all_data");
    showMessage("All data has been reset", "success");
    showResetConfirm = false;
    
    // Reload everything
    await loadEntities();
    await loadWallets();
    await loadTransactions();
  } catch (e) {
    showMessage(`Reset failed: ${e}`, "error");
  }
  }

  $effect(() => { 
    selectedEntityId; 
    // Reset wallet filter when entity changes
    selectedWalletId = null;
    loadTransactions(); 
  });

  $effect(() => {
    selectedWalletId;
    // Reload when wallet filter changes (but don't reset it)
    loadTransactions();
  });
  
  $effect(() => {
    const interval = setInterval(() => {
      if (previousPrice) {
        showPriceChange = !showPriceChange;
      }
    }, 30000);
    return () => clearInterval(interval);
  });

  // Load data after unlock
  $effect(() => {
    if (!appLocked && !checkingEncryption) {
      loadEntities();
      loadWallets();
      loadCategories();
      loadSettings();
      loadTheme();
      loadAutoLockSetting().then(() => setupAutoLock());
      loadFiatSettings().then(() => {
        loadCachedCurrentPrice().then(() => {
          if (fiatEnabled) fetchCurrentPrice();
        });
      });
    }
  });

  // Init
  checkEncryptionStatus().then(() => {
    if (!appLocked) {
      loadEntities();
      loadWallets();
      loadCategories();
      loadSettings();
      loadTheme();
      loadAutoLockSetting().then(() => setupAutoLock());
      loadFiatSettings().then(() => {
        loadCachedCurrentPrice().then(() => {
          if (fiatEnabled) fetchCurrentPrice();
        });
      });
    }
  });

  setupActivityTracking();

</script>

<div class="app">
  {#if checkingEncryption}
    <!-- Loading state while checking encryption -->
    <div class="unlock-screen">
      <div class="unlock-container">
        <div class="unlock-logo">
          <span class="logo-sat">Sat</span><span class="logo-stone">Stone</span>
        </div>
        <div class="loading-spinner"></div>
        <p class="unlock-loading">Loading...</p>
      </div>
    </div>
  {:else if appLocked}
    <!-- Unlock screen -->
    <div class="unlock-screen">
      <div class="unlock-container">
        <div class="unlock-logo">
          <span class="logo-sat">Sat</span><span class="logo-stone">Stone</span>
        </div>
        <h1 class="unlock-title">Welcome Back</h1>
        <p class="unlock-subtitle">Enter your passphrase to unlock</p>
        
        <div class="unlock-tabs">
          <button 
            class="unlock-tab" 
            class:active={unlockMode === "passphrase"}
            onclick={() => { unlockMode = "passphrase"; unlockError = ""; }}
          >
            Passphrase
          </button>
          <button 
            class="unlock-tab" 
            class:active={unlockMode === "recovery"}
            onclick={() => { unlockMode = "recovery"; unlockError = ""; }}
          >
            Recovery Phrase
          </button>
        </div>
        
        {#if unlockMode === "passphrase"}
          <div class="unlock-form">
            <input 
              type="password" 
              bind:value={unlockPassphrase} 
              placeholder="Enter passphrase..."
              class="unlock-input"
              onkeydown={(e) => e.key === 'Enter' && unlockWithPassphrase()}
            />
            <button class="btn primary unlock-btn" onclick={unlockWithPassphrase}>
              Unlock
            </button>
          </div>
        {:else}
          <div class="unlock-form">
            <textarea 
              bind:value={recoveryInput} 
              placeholder="Enter your 12-word recovery phrase..."
              class="unlock-textarea"
              rows="3"
            ></textarea>
            <button class="btn primary unlock-btn" onclick={unlockWithRecovery}>
              Unlock with Recovery
            </button>
          </div>
        {/if}
        
        {#if unlockError}
          <p class="unlock-error">{unlockError}</p>
        {/if}
        
        <p class="unlock-hint">
          {#if unlockMode === "passphrase"}
            Forgot your passphrase? Use your <button class="link-btn" onclick={() => unlockMode = "recovery"}>recovery phrase</button>
          {:else}
            Remember your passphrase? <button class="link-btn" onclick={() => unlockMode = "passphrase"}>Enter it here</button>
          {/if}
        </p>
      </div>
    </div>
  {:else}
  <header>
    <div class="header-left">
      <div class="logo">
        <Bitcoin size={24} color="#f7931a" />
        <span><span style="color: #f7931a;">Sat</span>Stone | <span style="color: #f7931a;">Bit</span>Counting</span>
      </div>
    </div>
    <div class="header-center">
      <Dropdown options={entityOptions} bind:value={selectedEntityId} placeholder="All accounts" />
      <Dropdown options={walletOptions} bind:value={selectedWalletId} placeholder="All wallets" />
    </div>
    <div class="header-right">
      <div class="header-stat">
        <span class="stat-label">Total Balance</span>
        <span class="stat-main">{formatSats(getTotalBalance())}</span>
        {#if fiatEnabled && currentFiatPrice}
          <span class="stat-sub">{formatBalanceFiat(getTotalBalance())}</span>
        {/if}
      </div>
      
      {#if fiatEnabled}
        <div class="header-stat">
          <span class="stat-label">BTC / {fiatCurrency}</span>
          <span class="stat-main btc-price-value">
            {#if currentFiatPrice}
              {fiatCurrency === "EUR" ? "€" : "$"}{currentFiatPrice.toLocaleString()}
            {:else}
              —
            {/if}
          </span>
          <span class="stat-sub">
            {#if getPriceChange()}
              <span class:positive={getPriceChange()?.value ?? 0 >= 0} class:negative={getPriceChange()?.value ?? 0 < 0}>
                {formatPriceChange()}
              </span>
            {:else if priceLastUpdated}
              {priceLastUpdated.toLocaleTimeString()}
            {:else}
              —
            {/if}
          </span>
        </div>
      {/if}

      <button 
        class="icon-btn refresh-price" 
        onclick={fetchCurrentPrice} 
        disabled={priceLoading} 
        title="Refresh price"
        class:spinning={priceLoading}
      >
        <Refresh size={16} />
      </button>
    </div>
  </header>

  <nav class="tabs">
    <button class="tab" class:active={activeTab === "dashboard"} onclick={() => activeTab = "dashboard"}>Dashboard</button>
    <button class="tab" class:active={activeTab === "wallets"} onclick={() => activeTab = "wallets"}>Wallets</button>
    <button class="tab" class:active={activeTab === "transactions"} onclick={() => activeTab = "transactions"}>Transactions</button>
    <button class="tab" class:active={activeTab === "settings"} onclick={() => activeTab = "settings"}>Settings</button>
  </nav>

  {#if message}
    <div class="toast {messageType}">{message}</div>
  {/if}

  <main>
    {#if activeTab === "dashboard"}
      <div class="page-header">
        <h1>Dashboard</h1>
        <div class="filters">
          <select class="filter-select" bind:value={filterYear}>
            <option value={null}>Years</option>
            {#each availableYears as year}<option value={year}>{year}</option>{/each}
          </select>
          <select class="filter-select" bind:value={filterMonth}>
            <option value={null}>Months</option>
            {#each MONTHS as month}<option value={month.value}>{month.label}</option>{/each}
          </select>
          {#if filterYear !== null || filterMonth !== null}
            <button class="btn-clear" onclick={clearFilters}>Clear</button>
          {/if}
        </div>
      </div>

      <!-- Row 1: Balance, Income, Spent, Flow -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">{filterYear || filterMonth ? "Period Balance" : "Total Balance"}</span>
          <span class="stat-value primary">
            {formatSats(filterYear || filterMonth ? filteredBalance : getTotalBalance())}
          </span>
          {#if Object.keys(fiatHoldings).length > 0}
            <div class="stat-sub-holdings">
              {#each Object.entries(fiatHoldings) as [curr, amount]}
                <span class="fiat-holding" class:positive={amount >= 0} class:negative={amount < 0}>
                  {curr === 'EUR' ? '€' : '$'}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              {/each}
            </div>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Income</span>
          <span class="stat-value positive">{formatSats(totalIncome)}</span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-sub">{formatBalanceFiat(totalIncome)}</span>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Spent</span>
          <span class="stat-value negative">{formatSats(totalSpent)}</span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-sub">{formatBalanceFiat(totalSpent)}</span>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Flow</span>
          <span class="stat-value" class:positive={totalFlow >= 0} class:negative={totalFlow < 0}>
            {formatSats(totalFlow, true)}
          </span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-sub">{formatBalanceFiat(totalFlow)}</span>
          {/if}
        </div>
      </div>

      <!-- Row 2: Realized P&L, Unrealized P&L, Fees, Total P&L -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Realized P&L</span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-value" class:positive={pnlData.realized.fiat >= 0} class:negative={pnlData.realized.fiat < 0}>
              {formatPnL(pnlData.realized)}
            </span>
          {:else}
            <span class="stat-value muted">Enable fiat</span>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Unrealized P&L</span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-value" class:positive={pnlData.unrealized.fiat >= 0} class:negative={pnlData.unrealized.fiat < 0}>
              {formatPnL(pnlData.unrealized)}
            </span>
          {:else}
            <span class="stat-value muted">Enable fiat</span>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Fees Paid</span>
          <span class="stat-value negative">
            {#if totalFees.btcFees > 0}
              {formatSats(totalFees.btcFees)}
            {:else}
              —
            {/if}
          </span>
          {#if Object.keys(totalFees.fiatFees).length > 0}
            <div class="stat-sub-holdings">
              {#each Object.entries(totalFees.fiatFees) as [curr, amount]}
                <span class="fiat-holding negative">
                  {curr === 'EUR' ? '€' : '$'}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              {/each}
            </div>
          {/if}
        </div>
        <div class="stat-card">
          <span class="stat-label">Total P&L</span>
          {#if fiatEnabled && currentFiatPrice}
            <span class="stat-value" class:positive={pnlData.total.fiat >= 0} class:negative={pnlData.total.fiat < 0}>
              {formatPnL(pnlData.total)}
            </span>
          {:else}
            <span class="stat-value muted">Enable fiat</span>
          {/if}
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h2>Monthly Flow</h2>
          {#if monthlyBalance.length === 0}
            <div class="chart-empty">No transaction data yet</div>
          {:else}
            <BarChart data={monthlyBalance} height={200} />
          {/if}
        </div>
        <div class="chart-card">
          <h2>Spending by Category</h2>
          {#if categoryBreakdown.length === 0}
            <div class="chart-empty">No spending data yet</div>
          {:else}
            <PieChart data={categoryBreakdown} size={160} />
          {/if}
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h2>Balance History</h2>
          {#if balanceHistory.length === 0}
            <div class="chart-empty">No transaction data yet</div>
          {:else}
            <LineChart data={balanceHistory} height={200} />
          {/if}
        </div>
        <div class="chart-card">
          <h2>Holdings by Wallet</h2>
          {#if walletHoldings.length === 0}
            <div class="chart-empty">No wallet data yet</div>
          {:else}
            <PieChart data={walletHoldings} size={160} />
          {/if}
        </div>
      </div>

      <div class="chart-card full-width">
        <h2>Recent Activity</h2>
        {#if filteredTransactions.length === 0}
          <div class="chart-empty">No transactions yet</div>
        {:else}
          <div class="recent-list">
            {#each filteredTransactions.slice(0, 5) as tx}
              <div class="recent-item">
                <div class="recent-info">
                  <span class="recent-category">{tx.category || "Uncategorized"}</span>
                  <span class="recent-date">{formatDate(tx.timestamp)}</span>
                </div>
                <span class="recent-amount" class:positive={tx.amount_sats >= 0} class:negative={tx.amount_sats < 0}>
                  {formatSats(tx.amount_sats, true)}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === "wallets"}
      <div class="page-header">
        <h1>Wallets</h1>
        <button class="btn primary" onclick={() => showAddWallet = true}>
          <Plus size={18} /> Add Wallet
        </button>
      </div>

      {#if selectedEntityId !== null}
        <!-- Flat grid when specific account selected -->
        {#if getFilteredWallets().length === 0}
          <div class="empty-state">
            <Wallet size={48} color="#333" />
            <p>No wallets yet</p>
            <button class="btn primary" onclick={() => showAddWallet = true}>Add your first wallet</button>
          </div>
        {:else}
          <div class="wallet-grid">
            {#each getFilteredWallets() as wallet}
              <div class="wallet-card">
                <div class="wallet-card-header">
                  <div class="wallet-icon">
                    {#if wallet.owner_type === "business"}
                      <Briefcase size={20} color="#f7931a" />
                    {:else}
                      <Wallet size={20} color="#f7931a" />
                    {/if}
                  </div>
                  <div class="wallet-meta">
                    <span class="wallet-name">{wallet.name}</span>
                    <span class="wallet-owner">{wallet.owner_name}</span>
                  </div>
                  <div class="wallet-actions">
                    {#if wallet.wallet_type !== 'manual'}
                      <button class="icon-btn" onclick={() => syncWalletTransactions(wallet)} title="Sync" disabled={syncingWallet === wallet.id}>
                        <Refresh size={16} />
                      </button>
                    {/if}
                    <button class="icon-btn" onclick={() => openEditWallet(wallet)} title="Edit">✎</button>
                    <button class="icon-btn" onclick={() => openDeleteWallet(wallet)} title="Delete">✕</button>
                  </div>
                </div>
                <div class="wallet-card-body">
                  <span class="wallet-balance">{formatSats(balances[wallet.id] ?? 0)}</span>
                  <span class="wallet-type">{wallet.wallet_type === 'manual' ? 'Manual' : wallet.wallet_type}</span>
                </div>
                {#if syncingWallet === wallet.id}<div class="wallet-syncing">Syncing...</div>{/if}
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <!-- Grouped view when "All Accounts" selected -->
        <div class="wallet-groups">
          {#each ['personal', 'family', 'business'] as type}
            {@const typeData = walletsByTypeAndEntity[type]}
            <div class="wallet-type-section">
              <button class="type-header" onclick={() => toggleTypeCollapse(type)}>
                <span class="collapse-icon">{isTypeCollapsed(type) ? '▶' : '▼'}</span>
                <span class="type-name">{getTypeLabel(type)}</span>
                <span class="type-balance">{formatSats(typeData.totalBalance)}</span>
              </button>
              
              {#if !isTypeCollapsed(type)}
                <div class="type-content">
                  {#if typeData.entities.length === 0}
                    <div class="empty-type">
                      <span>No {type} accounts</span>
                    </div>
                  {:else}
                    {#each typeData.entities as { entity, wallets: entityWallets, totalBalance }}
                      <div class="entity-section">
                        <button class="entity-header" onclick={() => toggleEntityCollapse(entity.id)}>
                          <span class="collapse-icon small">{isEntityCollapsed(entity.id) ? '▶' : '▼'}</span>
                          <span class="entity-name">{entity.name}</span>
                          <span class="entity-balance">{formatSats(totalBalance)}</span>
                        </button>
                        
                        {#if !isEntityCollapsed(entity.id)}
                          <div class="entity-content">
                            {#if entityWallets.length === 0}
                              <div class="empty-entity">
                                <span>No wallets</span>
                                <button class="btn-add-small" onclick={() => openAddWalletForEntity(entity.id)}>
                                  <Plus size={14} /> Add Wallet
                                </button>
                              </div>
                            {:else}
                              <div class="wallet-grid">
                                {#each entityWallets as wallet}
                                  <div class="wallet-card">
                                    <div class="wallet-card-header">
                                      <div class="wallet-icon">
                                        {#if wallet.owner_type === "business"}
                                          <Briefcase size={20} color="#f7931a" />
                                        {:else}
                                          <Wallet size={20} color="#f7931a" />
                                        {/if}
                                      </div>
                                      <div class="wallet-meta">
                                        <span class="wallet-name">{wallet.name}</span>
                                      </div>
                                      <div class="wallet-actions">
                                        {#if wallet.wallet_type !== 'manual'}
                                          <button class="icon-btn" onclick={() => syncWalletTransactions(wallet)} title="Sync" disabled={syncingWallet === wallet.id}>
                                            <Refresh size={16} />
                                          </button>
                                        {/if}
                                        <button class="icon-btn" onclick={() => openEditWallet(wallet)} title="Edit">✎</button>
                                        <button class="icon-btn" onclick={() => openDeleteWallet(wallet)} title="Delete">✕</button>
                                      </div>
                                    </div>
                                    <div class="wallet-card-body">
                                      <span class="wallet-balance">{formatSats(balances[wallet.id] ?? 0)}</span>
                                      <span class="wallet-type">{wallet.wallet_type === 'manual' ? 'Manual' : wallet.wallet_type}</span>
                                    </div>
                                    {#if syncingWallet === wallet.id}<div class="wallet-syncing">Syncing...</div>{/if}
                                  </div>
                                {/each}
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if activeTab === "transactions"}
      <div class="page-header">
        <h1>Transactions</h1>
        <div class="page-actions">
          <span class="tx-count">{filteredTransactions.length} transactions</span>
          <div class="filters">
            <select class="filter-select" bind:value={filterYear}>
              <option value={null}>Years</option>
              {#each availableYears as year}<option value={year}>{year}</option>{/each}
            </select>
            <select class="filter-select" bind:value={filterMonth}>
              <option value={null}>Months</option>
              {#each MONTHS as month}<option value={month.value}>{month.label}</option>{/each}
            </select>
            {#if filterYear !== null || filterMonth !== null}
              <button class="btn-clear" onclick={clearFilters}>Clear</button>
            {/if}
          </div>
          <button class="btn secondary" onclick={openImportCSV}>
            Import CSV
          </button>
          <button class="btn primary" onclick={() => { txWalletId = wallets[0]?.id || 0; showAddTransaction = true; }}>
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {#if loadingTxs}
        <div class="loading">Loading transactions...</div>
      {:else if transactions.length === 0}
        <div class="empty-state">
          <Bitcoin size={48} color="#333" />
          <p>No transactions yet</p>
          <span class="empty-hint">Sync a wallet to fetch transactions</span>
        </div>
      {:else}
        <div class="tx-table">
          <div class="tx-header" class:has-fiat={fiatEnabled}>
            <button class="tx-th sortable" onclick={() => handleSort("timestamp")}>Date{getSortIndicator("timestamp")}</button>
            <button class="tx-th sortable" onclick={() => handleSort("amount_sats")}>Amount{getSortIndicator("amount_sats")}</button>
            {#if fiatEnabled}<div class="tx-th">Fiat</div>{/if}
            <div class="tx-th">Fee</div>
            <button class="tx-th sortable" onclick={() => handleSort("wallet_name")}>Wallet{getSortIndicator("wallet_name")}</button>
            <button class="tx-th sortable" onclick={() => handleSort("category")}>Category{getSortIndicator("category")}</button>
            <div class="tx-th">Note</div>
            <div class="tx-th">ID</div>
            <div class="tx-th">Actions</div>
          </div>
          <div class="tx-body">
            {#each sortedTransactions as tx}
              <div class="tx-row" class:has-fiat={fiatEnabled}>
                <div class="tx-cell tx-date">
                  <span class="date-main">{formatDate(tx.timestamp)}</span>
                  {#if tx.timestamp}
                    <span class="date-time">{formatTime(tx.timestamp)}</span>
                  {/if}
                </div>
                <div class="tx-cell tx-amount" class:positive={tx.amount_sats >= 0} class:negative={tx.amount_sats < 0}>
                  {formatAmount(tx, true)}
                </div>
                {#if fiatEnabled}
                  <div class="tx-cell tx-fiat" class:positive={tx.amount_sats >= 0} class:negative={tx.amount_sats < 0}>
                    {#if (tx.currency || 'BTC') === 'BTC'}
                      {tx.fiat_value !== null ? formatFiat(tx.fiat_value) : "—"}
                    {:else}
                      —
                    {/if}
                  </div>
                {/if}
                <div class="tx-cell tx-fee">
                  {#if tx.fee_sats > 0 || (tx.fee_fiat && tx.fee_fiat > 0)}
                    {#if tx.fee_sats > 0}
                      <span class="fee-btc">{tx.fee_sats.toLocaleString()} sats</span>
                    {/if}
                    {#if tx.fee_fiat && tx.fee_fiat > 0}
                      <span class="fee-fiat">{tx.fee_fiat_currency === 'EUR' ? '€' : '$'}{tx.fee_fiat.toFixed(2)}</span>
                    {/if}
                  {:else}
                    —
                  {/if}
                </div>
                <div class="tx-cell tx-wallet">{tx.wallet_name}</div>
                <div class="tx-cell tx-category">
                  <select value={tx.category || "Uncategorized"} onchange={(e) => updateCategory(tx, e.currentTarget.value)}>
                    {#each categoryNames as cat}<option value={cat}>{cat}</option>{/each}
                  </select>
                </div>
                <div class="tx-cell tx-note">
                  <input type="text" value={tx.note || ""} placeholder="Add note..." onblur={(e) => updateNote(tx, e.currentTarget.value)} />
                </div>
                <div class="tx-cell tx-id">
                  {#if getTxLink(tx)}
                    <a href={getTxLink(tx)} target="_blank" rel="noopener" title={tx.txid}>{formatTxId(tx.txid)}</a>
                  {:else}
                    <span title={tx.txid}>{formatTxId(tx.txid)}</span>
                  {/if}
                </div>
                <div class="tx-cell tx-actions">
                  <button class="tx-action-btn" onclick={() => openDuplicateTransaction(tx)} title="Duplicate">⧉</button>
                  {#if isManualTransaction(tx)}
                    <button class="tx-action-btn" onclick={() => openEditTransaction(tx)} title="Edit">✎</button>
                    <button class="tx-action-btn danger" onclick={() => openDeleteTransaction(tx)} title="Delete">✕</button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    {#if activeTab === "settings"}
      <div class="settings-layout">
        <!-- Sidebar -->
        <nav class="settings-sidebar">
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "display"}
            onclick={() => activeSettingsTab = "display"}
          >
            Display
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "pnl"}
            onclick={() => activeSettingsTab = "pnl"}
          >
            P&L Settings
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "categories"}
            onclick={() => activeSettingsTab = "categories"}
          >
            Categories
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "accounts"}
            onclick={() => activeSettingsTab = "accounts"}
          >
            Accounts
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "wallets"}
            onclick={() => activeSettingsTab = "wallets"}
          >
            Wallets
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "security"}
            onclick={() => activeSettingsTab = "security"}
          >
            Security
          </button>
          <button 
            class="settings-nav-item" 
            class:active={activeSettingsTab === "data"}
            onclick={() => activeSettingsTab = "data"}
          >
            Data
          </button>
        </nav>

        <!-- Content -->
        <div class="settings-content">
          {#if activeSettingsTab === "display"}
            <div class="settings-section">
              <h2>Display Preferences</h2>
              
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Theme</span>
                  <span class="setting-description">Choose your preferred color theme</span>
                </div>
                <div class="setting-control">
                  <div class="toggle-group">
                    <button 
                      class="toggle-option" 
                      class:active={theme === "dark"}
                      onclick={() => setTheme("dark")}
                    >
                      Dark
                    </button>
                    <button 
                      class="toggle-option" 
                      class:active={theme === "light"}
                      onclick={() => setTheme("light")}
                    >
                      Light
                    </button>
                  </div>
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Bitcoin Unit</span>
                  <span class="setting-description">Display amounts in sats or BTC</span>
                </div>
                <div class="setting-control">
                  <div class="toggle-group">
                    <button 
                      class="toggle-option" 
                      class:active={currencyFormat === "sats"}
                      onclick={() => setCurrencyFormat("sats")}
                    >
                      Sats
                    </button>
                    <button 
                      class="toggle-option" 
                      class:active={currencyFormat === "btc"}
                      onclick={() => setCurrencyFormat("btc")}
                    >
                      BTC
                    </button>
                  </div>
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Show Fiat Values</span>
                  <span class="setting-description">Display fiat equivalents alongside BTC</span>
                </div>
                <div class="setting-control">
                  <button 
                    class="toggle-btn" 
                    class:active={fiatEnabled} 
                    onclick={() => setFiatEnabled(!fiatEnabled)}
                  >
                    <span class="toggle-knob"></span>
                  </button>
                </div>
              </div>

              {#if fiatEnabled}
                <div class="setting-row">
                  <div class="setting-info">
                    <span class="setting-label">Fiat Currency</span>
                    <span class="setting-description">Select your preferred fiat currency</span>
                  </div>
                  <div class="setting-control">
                    <div class="toggle-group">
                      <button 
                        class="toggle-option" 
                        class:active={fiatCurrency === "EUR"}
                        onclick={() => setFiatCurrency("EUR")}
                      >
                        € EUR
                      </button>
                      <button 
                        class="toggle-option" 
                        class:active={fiatCurrency === "USD"}
                        onclick={() => setFiatCurrency("USD")}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

          {:else if activeSettingsTab === "pnl"}
            <div class="settings-section">
              <h2>P&L Settings</h2>
              
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-label">Cost Basis Method</span>
                  <span class="setting-description">Method used to calculate realized gains/losses</span>
                </div>
                <div class="setting-control">
                  <div class="toggle-group">
                    <button 
                      class="toggle-option" 
                      class:active={costBasisMethod === "average"}
                      onclick={() => setCostBasisMethod("average")}
                    >
                      Average
                    </button>
                    <button 
                      class="toggle-option" 
                      class:active={costBasisMethod === "fifo"}
                      onclick={() => setCostBasisMethod("fifo")}
                    >
                      FIFO
                    </button>
                  </div>
                </div>
              </div>

              <div class="setting-row column">
                <div class="setting-info">
                  <span class="setting-label">Historical Fiat Values</span>
                  <span class="setting-description">
                    Fetch historical prices for transactions without fiat values. 
                    This uses the Coingecko API and may take several minutes.
                  </span>
                </div>
                <div class="setting-action">
                  {#if currentFiatPrice}
                    <div class="price-badge">
                      Current: {fiatCurrency === "EUR" ? "€" : "$"}{currentFiatPrice.toLocaleString()}
                      {#if priceLastUpdated}
                        <span class="price-time">({priceLastUpdated.toLocaleTimeString()})</span>
                      {/if}
                    </div>
                  {/if}
                  <button 
                    class="btn secondary" 
                    onclick={updateTransactionsFiatValues}
                    disabled={fetchingFiatValues || !fiatEnabled}
                  >
                    {#if fetchingFiatValues}
                      <span class="spinner"></span>
                      Fetching...
                    {:else}
                      Fetch Missing Fiat Values
                    {/if}
                  </button>
                </div>
              </div>
            </div>

          {:else if activeSettingsTab === "accounts"}
            <div class="settings-section">
              <h2>Accounts</h2>
              <p class="section-description">Manage your personal, family, and business accounts.</p>
              
              <!-- Personal -->
              <div class="account-group">
                <div class="account-group-header">
                  <h3>Personal</h3>
                </div>
                <div class="account-list">
                  {#each entities.filter(e => e.entity_type === "personal") as entity}
                    <div class="account-item">
                      <span class="account-name">{entity.name}</span>
                      <span class="account-badge primary">You</span>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Family -->
              <div class="account-group">
                <div class="account-group-header">
                  <h3>Family</h3>
                  <button class="btn-add-inline" onclick={() => { entityModalType = "family"; showAddEntity = true; }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div class="account-list">
                  {#each entities.filter(e => e.entity_type === "family") as entity}
                    <div class="account-item">
                      <span class="account-name">{entity.name}</span>
                      <button class="btn-icon-small danger" onclick={() => openDeleteEntity(entity)} title="Delete">
                        ✕
                      </button>
                    </div>
                  {:else}
                    <div class="empty-list">No family members added</div>
                  {/each}
                </div>
              </div>

              <!-- Business -->
              <div class="account-group">
                <div class="account-group-header">
                  <h3>Business</h3>
                  <button class="btn-add-inline" onclick={() => { entityModalType = "business"; showAddEntity = true; }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div class="account-list">
                  {#each entities.filter(e => e.entity_type === "business") as entity}
                    <div class="account-item">
                      <span class="account-name">{entity.name}</span>
                      {#if entity.parent_id}
                        <span class="account-badge">{entities.find(e => e.id === entity.parent_id)?.name}</span>
                      {/if}
                      <button class="btn-icon-small danger" onclick={() => openDeleteEntity(entity)} title="Delete">
                        ✕
                      </button>
                    </div>
                  {:else}
                    <div class="empty-list">No businesses added</div>
                  {/each}
                </div>
              </div>
            </div>

          {:else if activeSettingsTab === "wallets"}
            <div class="settings-section">
              <div class="section-header">
                <div>
                  <h2>Wallets</h2>
                  <p class="section-description">Manage your Bitcoin wallets.</p>
                </div>
                <button class="btn primary" onclick={() => showAddWallet = true}>
                  <Plus size={16} /> Add Wallet
                </button>
              </div>
              
              <div class="wallet-list">
                {#each wallets as wallet}
                  <div class="wallet-list-item">
                    <div class="wallet-list-info">
                      <span class="wallet-list-name">{wallet.name}</span>
                      <span class="wallet-list-meta">
                        {wallet.owner_name} · {wallet.wallet_type === 'manual' ? 'Manual' : wallet.wallet_type}
                      </span>
                    </div>
                    <span class="wallet-list-balance">{formatSats(balances[wallet.id] ?? 0)}</span>
                    <div class="wallet-list-actions">
                      <button class="btn-icon-small" onclick={() => openEditWallet(wallet)} title="Edit">✎</button>
                      <button class="btn-icon-small danger" onclick={() => openDeleteWallet(wallet)} title="Delete">✕</button>
                    </div>
                  </div>
                {:else}
                  <div class="empty-list">No wallets added</div>
                {/each}
              </div>
            </div>
          {:else if activeSettingsTab === "categories"}
            <div class="settings-section">
              <div class="section-header">
                <div>
                  <h2>Categories</h2>
                  <p class="section-description">Manage transaction categories. System categories cannot be edited or deleted.</p>
                </div>
                <button class="btn primary" onclick={() => showAddCategory = true}>
                  <Plus size={16} /> Add Category
                </button>
              </div>
              
              <!-- System Categories -->
              <div class="category-group">
                <h3>System Categories</h3>
                <div class="category-list">
                  {#each categories.filter(c => c.is_system) as category}
                    <div class="category-item system">
                      <span class="category-name">{category.name}</span>
                      <span class="category-badge">System</span>
                    </div>
                  {/each}
                </div>
              </div>
              
              <!-- Custom Categories -->
              <div class="category-group">
                <h3>Custom Categories</h3>
                <div class="category-list">
                  {#each categories.filter(c => !c.is_system) as category}
                    <div class="category-item">
                      <span class="category-name">{category.name}</span>
                      <div class="category-actions">
                        <button class="btn-icon-small" onclick={() => openEditCategory(category)} title="Edit">✎</button>
                        <button class="btn-icon-small danger" onclick={() => openDeleteCategory(category)} title="Delete">✕</button>
                      </div>
                    </div>
                  {:else}
                    <div class="empty-list">No custom categories. Click "Add Category" to create one.</div>
                  {/each}
                </div>
              </div>
            </div>
          {:else if activeSettingsTab === "security"}
            <div class="settings-section">
              <h2>Security</h2>
              <p class="section-description">Protect your data with AES-256 encryption.</p>
              
              <!-- Encryption Status -->
              <div class="setting-row column">
                <div class="setting-info">
                  <span class="setting-label">Database Encryption</span>
                  <span class="setting-description">
                    {#if dbEncrypted}
                      Your database is encrypted with AES-256. Only you can access your data.
                    {:else}
                      Your database is not encrypted. Enable encryption to protect your data.
                    {/if}
                  </span>
                </div>
                <div class="setting-action">
                  {#if dbEncrypted}
                    <span class="encryption-badge active">
                      <span class="badge-icon">🔒</span> Encrypted
                    </span>
                    <button class="btn secondary" onclick={() => showChangePassphrase = true}>
                      Change Passphrase
                    </button>
                    <button class="btn secondary" onclick={() => showRemoveEncryption = true}>
                      Remove Encryption
                    </button>
                  {:else}
                    <span class="encryption-badge inactive">
                      <span class="badge-icon">🔓</span> Not Encrypted
                    </span>
                    <button class="btn primary" onclick={startEncryptionSetup}>
                      Enable Encryption
                    </button>
                  {/if}
                </div>
              </div>
              
              <!-- Auto-Lock -->
              {#if dbEncrypted}
                <div class="setting-row">
                  <div class="setting-info">
                    <span class="setting-label">Auto-Lock</span>
                    <span class="setting-description">Automatically lock the app after a period of inactivity</span>
                  </div>
                  <div class="setting-control">
                    <select 
                      class="settings-select" 
                      value={autoLockTime}
                      onchange={(e) => setAutoLockTime(e.currentTarget.value as typeof autoLockTime)}
                    >
                      <option value="never">Never</option>
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                </div>
                
                <!-- Manual Lock -->
                <div class="setting-row">
                  <div class="setting-info">
                    <span class="setting-label">Lock Now</span>
                    <span class="setting-description">Manually lock the app immediately</span>
                  </div>
                  <div class="setting-control">
                    <button class="btn secondary" onclick={() => appLocked = true}>
                      Lock App
                    </button>
                  </div>
                </div>
              {/if}
            </div>

          {:else if activeSettingsTab === "data"}
            <div class="settings-section">
              <h2>Data Management</h2>
              
              <div class="setting-row column">
                <div class="setting-info">
                  <span class="setting-label">Export Data</span>
                  <span class="setting-description">
                    Download all your transactions as a CSV file for backup or analysis.
                  </span>
                </div>
                <div class="setting-action">
                  <button 
                    class="btn secondary" 
                    onclick={exportAllData}
                    disabled={exportingData}
                  >
                    {#if exportingData}
                      <span class="spinner"></span>
                      Exporting...
                    {:else}
                      Export to CSV
                    {/if}
                  </button>
                </div>
              </div>

              <div class="setting-row column danger-zone">
                <div class="setting-info">
                  <span class="setting-label">Reset All Data</span>
                  <span class="setting-description">
                    Permanently delete all wallets, transactions, and settings. This action cannot be undone.
                  </span>
                </div>
                <div class="setting-action">
                  <button 
                    class="btn danger" 
                    onclick={() => showResetConfirm = true}
                  >
                    Reset All Data
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
  {/if}
</div>

<Modal title="Add Wallet" open={showAddWallet} onclose={() => showAddWallet = false}>
  <div class="form-group">
    <label for="wallet-name">Name</label>
    <input id="wallet-name" bind:value={walletName} placeholder="My Bitcoin Wallet" />
  </div>
  
  <div class="form-group">
    <label>Wallet Type</label>
    <div class="wallet-type-toggle">
      <button 
        class="type-btn" 
        class:active={!walletIsManual} 
        onclick={() => walletIsManual = false}
      >
        Watch-only (xpub)
      </button>
      <button 
        class="type-btn" 
        class:active={walletIsManual} 
        onclick={() => walletIsManual = true}
      >
        Manual
      </button>
    </div>
  </div>
  
  {#if !walletIsManual}
    <div class="form-group">
      <label for="wallet-xpub">Extended Public Key</label>
      <input id="wallet-xpub" bind:value={walletXpub} placeholder="xpub / ypub / zpub" />
    </div>
    <div class="form-row-modal">
      <div class="form-group">
        <label for="wallet-type">Address Type</label>
        <select id="wallet-type" bind:value={walletType}>
          <option value="zpub">zpub (Native SegWit)</option>
          <option value="ypub">ypub (SegWit)</option>
          <option value="xpub">xpub (Legacy)</option>
        </select>
      </div>
      <div class="form-group">
        <label for="wallet-owner">Owner</label>
        <select id="wallet-owner" bind:value={walletEntityId}>
          {#each entities as entity}<option value={entity.id}>{entity.name}</option>{/each}
        </select>
      </div>
    </div>
  {:else}
    <div class="manual-wallet-info">
      <p>Manual wallets don't sync from the blockchain.</p>
      <p>Use this for Lightning wallets, exchange accounts, or any wallet where you'll import transactions via CSV or add them manually.</p>
    </div>
    <div class="form-group">
      <label for="wallet-owner-manual">Owner</label>
      <select id="wallet-owner-manual" bind:value={walletEntityId}>
        {#each entities as entity}<option value={entity.id}>{entity.name}</option>{/each}
      </select>
    </div>
  {/if}
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => showAddWallet = false}>Cancel</button>
    <button class="btn primary" onclick={addWallet}>Add Wallet</button>
  </div>
</Modal>

<Modal title={entityModalType === "family" ? "Add Family Member" : "Add Business"} open={showAddEntity} onclose={() => showAddEntity = false}>
  <div class="form-group">
    <label for="entity-name">Name</label>
    <input id="entity-name" bind:value={newEntityName} placeholder={entityModalType === "family" ? "e.g. Partner" : "e.g. My Company"} />
  </div>
  {#if entityModalType === "business"}
    <div class="form-group">
      <label for="entity-owner">Owner (optional)</label>
      <select id="entity-owner" bind:value={newBusinessParent}>
        <option value={null}>No owner</option>
        {#each getEntityOwners() as owner}<option value={owner.id}>{owner.name}</option>{/each}
      </select>
    </div>
  {/if}
  <div class="form-actions">
    <button class="btn secondary" onclick={() => showAddEntity = false}>Cancel</button>
    <button class="btn primary" onclick={addEntity}>Add</button>
  </div>
</Modal>

<ConfirmDelete open={showDeleteWallet} name={walletToDelete?.name ?? ""} onconfirm={confirmDeleteWallet} onclose={() => { showDeleteWallet = false; walletToDelete = null; }} />

<ConfirmDialog open={showDeleteEntity} title="Delete" message={`Delete "${entityToDelete?.name}"? Associated wallets will also be deleted.`} confirmText="Delete" danger={true} onconfirm={confirmDeleteEntity} onclose={() => { showDeleteEntity = false; entityToDelete = null; }} />

<Modal title="Edit Wallet" open={showEditWallet} onclose={() => { showEditWallet = false; walletToEdit = null; }}>
  <div class="form-group">
    <label for="edit-wallet-name">Name</label>
    <input id="edit-wallet-name" bind:value={editWalletName} placeholder="Wallet name" />
  </div>
  <div class="form-group">
    <label for="edit-wallet-owner">Owner</label>
    <select id="edit-wallet-owner" bind:value={editWalletEntityId}>
      {#each entities as entity}<option value={entity.id}>{entity.name}</option>{/each}
    </select>
  </div>
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showEditWallet = false; walletToEdit = null; }}>Cancel</button>
    <button class="btn primary" onclick={saveEditWallet}>Save</button>
  </div>
</Modal>

<!-- Add Manual Transaction Modal -->
<Modal title="Add Transaction" open={showAddTransaction} onclose={() => showAddTransaction = false}>
  <div class="tx-type-toggle">
    <button 
      class="type-btn" 
      class:active={txType === "incoming"} 
      onclick={() => txType = "incoming"}
    >
      Incoming
    </button>
    <button 
      class="type-btn" 
      class:active={txType === "outgoing"} 
      onclick={() => txType = "outgoing"}
    >
      Outgoing
    </button>
  </div>
  
  <div class="form-group">
    <label>Currency</label>
    <div class="currency-toggle">
      <button 
        class="type-btn small" 
        class:active={txCurrency === "BTC"} 
        onclick={() => txCurrency = "BTC"}
      >
        BTC
      </button>
      <button 
        class="type-btn small" 
        class:active={txCurrency === "EUR"} 
        onclick={() => txCurrency = "EUR"}
      >
        EUR
      </button>
      <button 
        class="type-btn small" 
        class:active={txCurrency === "USD"} 
        onclick={() => txCurrency = "USD"}
      >
        USD
      </button>
    </div>
  </div>
  
  <div class="form-group">
    <label for="tx-amount">Amount {#if txCurrency === 'BTC'}(sats or BTC){:else}({txCurrency}){/if}</label>
    <input 
      id="tx-amount" 
      type="text" 
      bind:value={txAmount} 
      placeholder={txCurrency === 'BTC' ? "e.g. 100000 or 0.001" : "e.g. 100.00"}
    />
    {#if txCurrency === 'BTC'}
      <span class="form-hint">Enter sats (whole number) or BTC (with decimal)</span>
    {/if}
  </div>
  
  <div class="form-row-modal">
    <div class="form-group">
      <label for="tx-wallet">Wallet</label>
      <select id="tx-wallet" bind:value={txWalletId}>
        {#each wallets as wallet}
          <option value={wallet.id}>{wallet.name}</option>
        {/each}
      </select>
    </div>
    <div class="form-group">
      <label for="tx-date">Date</label>
      <input id="tx-date" type="date" bind:value={txDate} />
    </div>
  </div>
  
  <div class="form-row-modal">
    <div class="form-group">
      <label for="tx-category">Category</label>
      <select id="tx-category" bind:value={txCategory}>
        {#each categoryNames as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
    </div>
    {#if txCurrency === 'BTC'}
      <div class="form-group">
        <label for="tx-fiat">Fiat Value ({fiatCurrency}, optional)</label>
        <input id="tx-fiat" type="text" bind:value={txFiatValue} placeholder="e.g. 85.50" />
      </div>
    {/if}
  </div>
  
  <div class="form-row-modal">
    <div class="form-group">
      <label for="tx-fee-sats">Fee (sats, optional)</label>
      <input id="tx-fee-sats" type="text" bind:value={txFeeSats} placeholder="e.g. 150" />
    </div>
    <div class="form-group">
      <label for="tx-fee-fiat">Fee ({fiatCurrency}, optional)</label>
      <input id="tx-fee-fiat" type="text" bind:value={txFeeFiat} placeholder="e.g. 0.50" />
    </div>
  </div>
  
  <div class="form-group">
    <label for="tx-note">Note (optional)</label>
    <input id="tx-note" type="text" bind:value={txNote} placeholder="Description..." />
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => showAddTransaction = false}>Cancel</button>
    <button class="btn primary" onclick={addManualTransaction}>
      Add {txType === "incoming" ? "Incoming" : "Outgoing"} Transaction
    </button>
  </div>
</Modal>

<!-- Add Category Modal -->
<Modal title="Add Category" open={showAddCategory} onclose={() => { showAddCategory = false; newCategoryName = ""; }}>
  <div class="form-group">
    <label for="new-category-name">Category Name</label>
    <input 
      id="new-category-name" 
      type="text" 
      bind:value={newCategoryName} 
      placeholder="e.g. Subscriptions, Donations..."
      onkeydown={(e) => e.key === 'Enter' && addNewCategory()}
    />
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showAddCategory = false; newCategoryName = ""; }}>Cancel</button>
    <button class="btn primary" onclick={addNewCategory}>Add Category</button>
  </div>
</Modal>

<!-- Edit Category Modal -->
<Modal title="Edit Category" open={showEditCategory} onclose={() => { showEditCategory = false; editingCategory = null; }}>
  <div class="form-group">
    <label for="edit-category-name">Category Name</label>
    <input 
      id="edit-category-name" 
      type="text" 
      bind:value={editCategoryName} 
      placeholder="Category name"
      onkeydown={(e) => e.key === 'Enter' && saveEditCategory()}
    />
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showEditCategory = false; editingCategory = null; }}>Cancel</button>
    <button class="btn primary" onclick={saveEditCategory}>Save</button>
  </div>
</Modal>

<!-- Delete Category Confirmation -->
<ConfirmDialog 
  open={showDeleteCategory} 
  title="Delete Category"
  message={`Delete "${categoryToDelete?.name}"? All transactions with this category will be set to "Uncategorized".`}
  confirmText="Delete"
  danger={true}
  onconfirm={confirmDeleteCategory}
  onclose={() => { showDeleteCategory = false; categoryToDelete = null; }}
/>

<!-- Edit Manual Transaction Modal -->
<Modal title="Edit Transaction" open={showEditTransaction} onclose={() => { showEditTransaction = false; editingTx = null; }}>
  <div class="tx-type-toggle">
    <button 
      class="type-btn" 
      class:active={editTxType === "incoming"} 
      onclick={() => editTxType = "incoming"}
    >
      Incoming
    </button>
    <button 
      class="type-btn" 
      class:active={editTxType === "outgoing"} 
      onclick={() => editTxType = "outgoing"}
    >
      Outgoing
    </button>
  </div>
  
  <div class="form-group">
    <label>Currency</label>
    <div class="currency-toggle">
      <button 
        class="type-btn small" 
        class:active={editTxCurrency === "BTC"} 
        onclick={() => editTxCurrency = "BTC"}
      >
        BTC
      </button>
      <button 
        class="type-btn small" 
        class:active={editTxCurrency === "EUR"} 
        onclick={() => editTxCurrency = "EUR"}
      >
        EUR
      </button>
      <button 
        class="type-btn small" 
        class:active={editTxCurrency === "USD"} 
        onclick={() => editTxCurrency = "USD"}
      >
        USD
      </button>
    </div>
  </div>
  
  <div class="form-group">
    <label for="edit-tx-amount">Amount {#if editTxCurrency === 'BTC'}(sats or BTC){:else}({editTxCurrency}){/if}</label>
    <input 
      id="edit-tx-amount" 
      type="text" 
      bind:value={editTxAmount} 
      placeholder={editTxCurrency === 'BTC' ? "e.g. 100000 or 0.001" : "e.g. 100.00"}
    />
    {#if editTxCurrency === 'BTC'}
      <span class="form-hint">Enter sats (whole number) or BTC (with decimal)</span>
    {/if}
  </div>
  
  <div class="form-row-modal">
    <div class="form-group">
      <label for="edit-tx-date">Date</label>
      <input id="edit-tx-date" type="date" bind:value={editTxDate} />
    </div>
    <div class="form-group">
      <label for="edit-tx-category">Category</label>
      <select id="edit-tx-category" bind:value={editTxCategory}>
        {#each categoryNames as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <div class="form-row-modal">
    {#if editTxCurrency === 'BTC'}
      <div class="form-group">
        <label for="edit-tx-fiat">Fiat Value ({fiatCurrency}, optional)</label>
        <input id="edit-tx-fiat" type="text" bind:value={editTxFiatValue} placeholder="e.g. 85.50" />
      </div>
    {/if}
    <div class="form-group">
      <label for="edit-tx-note">Note (optional)</label>
      <input id="edit-tx-note" type="text" bind:value={editTxNote} placeholder="Description..." />
    </div>
  </div>
  
  <div class="form-row-modal">
    <div class="form-group">
      <label for="edit-tx-fee-sats">Fee (sats, optional)</label>
      <input id="edit-tx-fee-sats" type="text" bind:value={editTxFeeSats} placeholder="e.g. 150" />
    </div>
    <div class="form-group">
      <label for="edit-tx-fee-fiat">Fee ({fiatCurrency}, optional)</label>
      <input id="edit-tx-fee-fiat" type="text" bind:value={editTxFeeFiat} placeholder="e.g. 0.50" />
    </div>
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showEditTransaction = false; editingTx = null; }}>Cancel</button>
    <button class="btn primary" onclick={saveEditTransaction}>Save Changes</button>
  </div>
</Modal>

<!-- Duplicate Transaction Modal -->
  <Modal title="Duplicate Transaction" open={showDuplicateTransaction} onclose={closeDuplicateModal}>
    <div class="duplicate-info">
      <p>Creating a copy of this transaction. Edit the values as needed.</p>
    </div>
    
    <div class="tx-type-toggle">
      <button 
        class="type-btn" 
        class:active={txType === "incoming"} 
        onclick={() => txType = "incoming"}
      >
        Incoming
      </button>
      <button 
        class="type-btn" 
        class:active={txType === "outgoing"} 
        onclick={() => txType = "outgoing"}
      >
        Outgoing
      </button>
    </div>
    
    <div class="form-group">
      <label>Currency</label>
      <div class="currency-toggle">
        <button 
          class="type-btn small" 
          class:active={txCurrency === "BTC"} 
          onclick={() => txCurrency = "BTC"}
        >
          BTC
        </button>
        <button 
          class="type-btn small" 
          class:active={txCurrency === "EUR"} 
          onclick={() => txCurrency = "EUR"}
        >
          EUR
        </button>
        <button 
          class="type-btn small" 
          class:active={txCurrency === "USD"} 
          onclick={() => txCurrency = "USD"}
        >
          USD
        </button>
      </div>
    </div>
    
    <div class="form-group">
      <label for="dup-tx-wallet">Wallet</label>
      <select id="dup-tx-wallet" bind:value={txWalletId}>
        {#each wallets as wallet}
          <option value={wallet.id}>{wallet.name} ({wallet.owner_name})</option>
        {/each}
      </select>
    </div>
    
    <div class="form-group">
      <label for="dup-tx-amount">Amount {#if txCurrency === 'BTC'}(sats or BTC){:else}({txCurrency}){/if}</label>
      <input 
        id="dup-tx-amount" 
        type="text" 
        bind:value={txAmount} 
        placeholder={txCurrency === 'BTC' ? "e.g. 100000 or 0.001" : "e.g. 100.00"}
      />
      {#if txCurrency === 'BTC'}
        <span class="form-hint">Enter sats (whole number) or BTC (with decimal)</span>
      {/if}
    </div>
    
    <div class="form-row-modal">
      <div class="form-group">
        <label for="dup-tx-date">Date</label>
        <input id="dup-tx-date" type="date" bind:value={txDate} />
      </div>
      <div class="form-group">
        <label for="dup-tx-category">Category</label>
        <select id="dup-tx-category" bind:value={txCategory}>
          {#each categoryNames as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="form-row-modal">
      {#if txCurrency === 'BTC'}
        <div class="form-group">
          <label for="dup-tx-fiat">Fiat Value ({fiatCurrency}, optional)</label>
          <input id="dup-tx-fiat" type="text" bind:value={txFiatValue} placeholder="e.g. 85.50" />
        </div>
      {/if}
      <div class="form-group">
        <label for="dup-tx-note">Note (optional)</label>
        <input id="dup-tx-note" type="text" bind:value={txNote} placeholder="Description..." />
      </div>
    </div>
    
    <div class="form-row-modal">
      <div class="form-group">
        <label for="dup-tx-fee-sats">Fee (sats, optional)</label>
        <input id="dup-tx-fee-sats" type="text" bind:value={txFeeSats} placeholder="e.g. 150" />
      </div>
      <div class="form-group">
        <label for="dup-tx-fee-fiat">Fee ({fiatCurrency}, optional)</label>
        <input id="dup-tx-fee-fiat" type="text" bind:value={txFeeFiat} placeholder="e.g. 0.50" />
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn secondary" onclick={closeDuplicateModal}>Cancel</button>
      <button class="btn primary" onclick={saveDuplicateTransaction}>Create Duplicate</button>
    </div>
  </Modal>

<!-- Delete Transaction Confirmation -->
<ConfirmDialog 
  open={showDeleteTransaction} 
  title="Delete Transaction"
  message={`Delete this ${txToDelete?.amount_sats ? formatSats(txToDelete.amount_sats) : ''} transaction? This cannot be undone.`}
  confirmText="Delete"
  danger={true}
  onconfirm={confirmDeleteTransaction}
  onclose={() => { showDeleteTransaction = false; txToDelete = null; }}
/>

<!-- Fiat Currency Change Confirmation -->
<Modal 
  title="Change Fiat Currency" 
  open={showFiatChangeConfirm} 
  onclose={cancelFiatCurrencyChange}
>
  <div class="confirm-content">
    <p class="confirm-message">
      You're changing from <strong>{fiatCurrency}</strong> to <strong>{pendingFiatCurrency}</strong>.
    </p>
    <p class="confirm-detail">
      You have <strong>{transactions.filter(tx => tx.fiat_value !== null).length}</strong> transactions with historical fiat values.
    </p>
    <p class="confirm-question">
      Would you like to update all historical transaction values to {pendingFiatCurrency}?
    </p>
    <p class="confirm-warning">
      This will fetch new prices from Coingecko and may take a few minutes depending on the number of unique dates.
    </p>
  </div>
  <div class="form-actions three-buttons">
    <button class="btn secondary" onclick={cancelFiatCurrencyChange}>Cancel</button>
    <button class="btn secondary" onclick={() => applyFiatCurrencyChange(pendingFiatCurrency!, false)}>
      Keep Old Values
    </button>
    <button class="btn primary" onclick={() => applyFiatCurrencyChange(pendingFiatCurrency!, true)}>
      Update All
    </button>
  </div>
</Modal>

<!-- Import CSV Modal -->
<Modal title="Import CSV" open={showImportCSV} onclose={closeImport}>
  {#if importStep === "upload"}
    <div class="import-upload">
      <div class="form-group">
        <label for="import-wallet">Import to Wallet</label>
        <select id="import-wallet" bind:value={importWalletId}>
          {#each wallets as wallet}
            <option value={wallet.id}>{wallet.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="file-upload">
        <label class="file-upload-label">
          <input type="file" accept=".csv" onchange={handleFileSelect} />
          <span class="file-upload-btn">Choose CSV File</span>
          <span class="file-upload-hint">Supported: Phoenix, Bitstack, Bull Bitcoin, LN Markets</span>
        </label>
      </div>
      
      {#if importErrors.length > 0}
        <div class="import-errors">
          {#each importErrors as error}
            <p class="error-text">{error}</p>
          {/each}
        </div>
      {/if}
    </div>
    
    <div class="form-actions">
      <button class="btn secondary" onclick={closeImport}>Cancel</button>
    </div>
    
  {:else if importStep === "preview"}
    <div class="import-preview">
      <div class="import-summary">
        <p><strong>Source:</strong> {importParserName}</p>
        <p><strong>File:</strong> {importFile?.name}</p>
        <p><strong>Transactions:</strong> {importTransactions.length}</p>
        <p><strong>Target Wallet:</strong> {wallets.find(w => w.id === importWalletId)?.name}</p>
      </div>
      
      {#if importWarnings.length > 0}
        <div class="import-warnings">
          <p class="warning-title">Warnings:</p>
          {#each importWarnings.slice(0, 5) as warning}
            <p class="warning-text">{warning}</p>
          {/each}
          {#if importWarnings.length > 5}
            <p class="warning-text">...and {importWarnings.length - 5} more</p>
          {/if}
        </div>
      {/if}
      
      {#if importErrors.length > 0}
        <div class="import-errors">
          <p class="error-title">Errors:</p>
          {#each importErrors.slice(0, 5) as error}
            <p class="error-text">{error}</p>
          {/each}
          {#if importErrors.length > 5}
            <p class="error-text">...and {importErrors.length - 5} more</p>
          {/if}
        </div>
      {/if}
      
      <div class="import-table">
        <div class="import-table-header">
          <span>Date</span>
          <span>Amount</span>
          <span>Category</span>
          <span>Note</span>
        </div>
        <div class="import-table-body">
          {#each importTransactions.slice(0, 10) as tx}
            <div class="import-table-row">
              <span>{formatImportDate(tx.timestamp)}</span>
              <span class:positive={tx.amount_sats >= 0} class:negative={tx.amount_sats < 0}>
                {formatSats(tx.amount_sats, true)}
              </span>
              <span>{tx.category}</span>
              <span class="truncate">{tx.note || "—"}</span>
            </div>
          {/each}
          {#if importTransactions.length > 10}
            <div class="import-table-more">
              ...and {importTransactions.length - 10} more transactions
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn secondary" onclick={() => { importStep = "upload"; importFile = null; }}>Back</button>
      <button class="btn primary" onclick={executeImport} disabled={importTransactions.length === 0}>
        Import {importTransactions.length} Transactions
      </button>
    </div>
    
  {:else if importStep === "importing"}
    <div class="import-progress">
      <div class="spinner large"></div>
      <p>Importing transactions...</p>
    </div>
    
  {:else if importStep === "done"}
    <div class="import-done">
      <div class="import-result">
        <p class="result-success">✓ Imported: {importResult?.imported}</p>
        <p class="result-skipped">⊘ Skipped (duplicates): {importResult?.skipped}</p>
        {#if importResult?.errors && importResult.errors.length > 0}
          <p class="result-errors">✕ Errors: {importResult.errors.length}</p>
        {/if}
      </div>
      
      {#if importResult?.errors && importResult.errors.length > 0}
        <div class="import-errors">
          {#each importResult.errors.slice(0, 5) as error}
            <p class="error-text">{error}</p>
          {/each}
        </div>
      {/if}
    </div>
    
    <div class="form-actions">
      <button class="btn primary" onclick={closeImport}>Done</button>
    </div>
  {/if}
</Modal>

<!-- Encryption Setup Modal -->
<Modal title="Enable Database Encryption" open={showEncryptionSetup} onclose={cancelEncryptionSetup}>
  {#if encryptionStep === "passphrase"}
    <div class="encryption-warning">
      <span class="warning-icon">⚠️</span>
      <p><strong>Important:</strong> If you lose your passphrase AND recovery phrase, your data will be permanently lost. There is no way to recover it.</p>
    </div>
    
    <div class="form-group">
      <label for="encrypt-pass">Create Passphrase</label>
      <input 
        id="encrypt-pass"
        type="password" 
        bind:value={encryptPassphrase} 
        placeholder="Enter a strong passphrase..."
        oninput={() => checkPasswordStrength(encryptPassphrase)}
      />
      {#if passwordStrength}
        <div class="password-strength">
          <div class="strength-bar">
            <div 
              class="strength-fill" 
              class:very-weak={passwordStrength.level === 'very_weak'}
              class:weak={passwordStrength.level === 'weak'}
              class:fair={passwordStrength.level === 'fair'}
              class:strong={passwordStrength.level === 'strong'}
              class:very-strong={passwordStrength.level === 'very_strong'}
              style="width: {passwordStrength.score}%"
            ></div>
          </div>
          <span class="strength-label" class:very-weak={passwordStrength.level === 'very_weak'} class:weak={passwordStrength.level === 'weak'} class:fair={passwordStrength.level === 'fair'} class:strong={passwordStrength.level === 'strong'} class:very-strong={passwordStrength.level === 'very_strong'}>
            {passwordStrength.label}
          </span>
        </div>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="encrypt-pass-confirm">Confirm Passphrase</label>
      <input 
        id="encrypt-pass-confirm"
        type="password" 
        bind:value={encryptPassphraseConfirm} 
        placeholder="Confirm your passphrase..."
      />
      {#if encryptPassphraseConfirm && encryptPassphrase !== encryptPassphraseConfirm}
        <span class="form-error">Passphrases do not match</span>
      {/if}
    </div>
    
    <div class="form-actions">
      <button class="btn secondary" onclick={cancelEncryptionSetup}>Cancel</button>
      <button 
        class="btn primary" 
        onclick={generateRecovery}
        disabled={!encryptPassphrase || encryptPassphrase !== encryptPassphraseConfirm}
      >
        Continue
      </button>
    </div>
    
  {:else if encryptionStep === "recovery"}
    <div class="recovery-section">
      <div class="recovery-warning">
        <span class="warning-icon">📝</span>
        <p><strong>Write this down!</strong> This 12-word phrase is the ONLY way to recover your data if you forget your passphrase.</p>
      </div>
      
      <div class="recovery-phrase-display">
        <div class="recovery-words">
          {#each encryptRecoveryPhrase.split(' ') as word, i}
            <div class="recovery-word">
              <span class="word-number">{i + 1}.</span>
              <span class="word-text">{word}</span>
            </div>
          {/each}
        </div>
        <button class="btn secondary copy-btn" onclick={copyRecoveryPhrase}>
          📋 Copy to Clipboard
        </button>
      </div>
      
      <div class="recovery-confirm">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={recoveryPhraseConfirmed} />
          <span>I have written down my recovery phrase and stored it safely</span>
        </label>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn secondary" onclick={() => encryptionStep = "passphrase"}>Back</button>
      <button 
        class="btn primary" 
        onclick={confirmEncryption}
        disabled={!recoveryPhraseConfirmed}
      >
        Enable Encryption
      </button>
    </div>
  {/if}
</Modal>

<!-- Change Passphrase Modal -->
<Modal title="Change Passphrase" open={showChangePassphrase} onclose={() => { showChangePassphrase = false; currentPassphrase = ""; newPassphrase = ""; newPassphraseConfirm = ""; newPasswordStrength = null; }}>
  <div class="form-group">
    <label for="current-pass">Current Passphrase</label>
    <input 
      id="current-pass"
      type="password" 
      bind:value={currentPassphrase} 
      placeholder="Enter current passphrase..."
    />
  </div>
  
  <div class="form-group">
    <label for="new-pass">New Passphrase</label>
    <input 
      id="new-pass"
      type="password" 
      bind:value={newPassphrase} 
      placeholder="Enter new passphrase..."
      oninput={() => checkNewPasswordStrength(newPassphrase)}
    />
    {#if newPasswordStrength}
      <div class="password-strength">
        <div class="strength-bar">
          <div 
            class="strength-fill" 
            class:very-weak={newPasswordStrength.level === 'very_weak'}
            class:weak={newPasswordStrength.level === 'weak'}
            class:fair={newPasswordStrength.level === 'fair'}
            class:strong={newPasswordStrength.level === 'strong'}
            class:very-strong={newPasswordStrength.level === 'very_strong'}
            style="width: {newPasswordStrength.score}%"
          ></div>
        </div>
        <span class="strength-label" class:very-weak={newPasswordStrength.level === 'very_weak'} class:weak={newPasswordStrength.level === 'weak'} class:fair={newPasswordStrength.level === 'fair'} class:strong={newPasswordStrength.level === 'strong'} class:very-strong={newPasswordStrength.level === 'very_strong'}>
          {newPasswordStrength.label}
        </span>
      </div>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="new-pass-confirm">Confirm New Passphrase</label>
    <input 
      id="new-pass-confirm"
      type="password" 
      bind:value={newPassphraseConfirm} 
      placeholder="Confirm new passphrase..."
    />
    {#if newPassphraseConfirm && newPassphrase !== newPassphraseConfirm}
      <span class="form-error">Passphrases do not match</span>
    {/if}
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showChangePassphrase = false; currentPassphrase = ""; newPassphrase = ""; newPassphraseConfirm = ""; newPasswordStrength = null; }}>
      Cancel
    </button>
    <button 
      class="btn primary" 
      onclick={changePassphrase}
      disabled={!currentPassphrase || !newPassphrase || newPassphrase !== newPassphraseConfirm}
    >
      Change Passphrase
    </button>
  </div>
</Modal>

<!-- Remove Encryption Modal -->
<Modal title="Remove Encryption" open={showRemoveEncryption} onclose={() => { showRemoveEncryption = false; removeEncryptionPassphrase = ""; }}>
  <div class="encryption-warning danger">
    <span class="warning-icon">⚠️</span>
    <p><strong>Warning:</strong> Removing encryption will make your database accessible without a passphrase. Anyone with access to your computer could view your financial data.</p>
  </div>
  
  <div class="form-group">
    <label for="remove-pass">Enter Passphrase to Confirm</label>
    <input 
      id="remove-pass"
      type="password" 
      bind:value={removeEncryptionPassphrase} 
      placeholder="Enter current passphrase..."
    />
  </div>
  
  <div class="form-actions">
    <button class="btn secondary" onclick={() => { showRemoveEncryption = false; removeEncryptionPassphrase = ""; }}>
      Cancel
    </button>
    <button 
      class="btn danger" 
      onclick={removeEncryption}
      disabled={!removeEncryptionPassphrase}
    >
      Remove Encryption
    </button>
  </div>
</Modal>

<!-- Reset Data Confirmation -->
<ConfirmDialog 
  open={showResetConfirm} 
  title="Reset All Data"
  message="Are you sure you want to delete ALL your data? This includes all wallets, transactions, accounts, and settings. This action cannot be undone."
  confirmText="Yes, Reset Everything"
  danger={true}
  onconfirm={resetAllData}
  onclose={() => showResetConfirm = false}
/>

<style>
  /* Theme Variables */
  :global(:root), :global([data-theme="dark"]) {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111;
    --bg-tertiary: #1a1a1a;
    --bg-hover: #151515;
    --bg-input: #0a0a0a;
    
    --border-primary: #1a1a1a;
    --border-secondary: #252525;
    --border-hover: #333;
    
    --text-primary: #e0e0e0;
    --text-secondary: #888;
    --text-muted: #555;
    --text-disabled: #444;
    
    --accent: #f7931a;
    --accent-hover: #ffa940;
    --accent-bg: rgba(247, 147, 26, 0.1);
    
    --positive: #4ade80;
    --negative: #f87171;
    --warning: #fbbf24;
    
    --header-bg: #0f0f0f;
    --card-bg: #111;
  }

  :global([data-theme="light"]) {
    --bg-primary: #f5f5f5;
    --bg-secondary: #fff;
    --bg-tertiary: #e8e8e8;
    --bg-hover: #f0f0f0;
    --bg-input: #fff;
    
    --border-primary: #e0e0e0;
    --border-secondary: #d0d0d0;
    --border-hover: #bbb;
    
    --text-primary: #1a1a1a;
    --text-secondary: #555;
    --text-muted: #888;
    --text-disabled: #aaa;
    
    --accent: #f7931a;
    --accent-hover: #e8850f;
    --accent-bg: rgba(247, 147, 26, 0.15);
    
    --positive: #16a34a;
    --negative: #dc2626;
    --warning: #ca8a04;
    
    --header-bg: #fff;
    --card-bg: #fff;
  }

  /* Base */
  :global(body) { 
    margin: 0; 
    background: var(--bg-primary); 
    color: var(--text-primary); 
  }

  .app { 
    min-height: 100vh; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  }

  /* Header - Fixed */
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-primary);
  }

  .header-left, .header-right { flex: 1; }

  .header-center {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .header-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  .header-stat .stat-label {
    font-size: 0.625rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-stat .stat-main {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--accent);
  }

  .header-stat .stat-sub {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  /* Tabs - Fixed below header */
  .tabs {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    z-index: 99;
    display: flex;
    gap: 0;
    padding: 1rem 0 0 0;
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-primary);
  }

  .tab { 
    padding: 1rem 1.5rem; 
    background: none; 
    border: none; 
    color: var(--text-muted); 
    font-size: 0.9375rem; 
    font-weight: 500; 
    cursor: pointer; 
    position: relative; 
    transition: color 0.15s; 
  }
  .tab:hover { color: var(--text-secondary); }
  .tab.active { color: var(--text-primary); }
  .tab.active::after { 
    content: ""; 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    right: 0; 
    height: 2px; 
    background: var(--accent); 
  }

  /* Main content - Add padding for fixed header */
  main {
    padding: 2rem;
    padding-top: 180px;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* Toast */
  .toast { 
    position: fixed; 
    bottom: 1.5rem; 
    left: 50%; 
    transform: translateX(-50%); 
    padding: 0.75rem 1.25rem; 
    border-radius: 8px; 
    font-size: 0.875rem; 
    font-weight: 500; 
    z-index: 300; 
    animation: toastIn 0.2s ease; 
  }
  .toast.info { 
    background: var(--bg-secondary); 
    border: 1px solid var(--border-secondary); 
    color: var(--text-primary);
  }
  .toast.success { 
    background: #0a2a1a; 
    border: 1px solid #0f4a2a; 
    color: var(--positive); 
  }
  .toast.error { 
    background: #2a0a0a; 
    border: 1px solid #4a1a1a; 
    color: var(--negative); 
  }
  @keyframes toastIn { 
    from { opacity: 0; transform: translateX(-50%) translateY(10px); } 
    to { opacity: 1; transform: translateX(-50%) translateY(0); } 
  }

  /* Page Header */
  .page-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 1.5rem; 
  }
  .page-header h1 { 
    margin: 0; 
    font-size: 1.5rem; 
    font-weight: 600; 
    color: var(--text-primary); 
  }
  .page-actions { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
  }
  .tx-count { 
    font-size: 0.875rem; 
    color: var(--text-muted); 
  }

  /* Buttons */
  .btn { 
    display: flex; 
    align-items: center; 
    gap: 0.5rem; 
    padding: 0.625rem 1.125rem; 
    border: none; 
    border-radius: 8px; 
    font-size: 0.875rem; 
    font-weight: 500; 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .btn.primary { 
    background: var(--accent); 
    color: #000; 
  }
  .btn.primary:hover { 
    background: var(--accent-hover); 
  }
  .btn.secondary { 
    background: var(--bg-tertiary); 
    color: var(--text-primary); 
    border: 1px solid var(--border-secondary); 
  }
  .btn.secondary:hover { 
    background: var(--bg-hover); 
    border-color: var(--border-hover); 
  }
  .btn.danger {
    background: #dc2626;
    color: #fff;
  }
  .btn.danger:hover {
    background: #ef4444;
  }

  .icon-btn { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    width: 32px; 
    height: 32px; 
    background: var(--bg-tertiary); 
    border: 1px solid var(--border-secondary); 
    border-radius: 6px; 
    color: var(--text-muted); 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .icon-btn:hover { 
    background: var(--border-secondary); 
    color: var(--text-primary); 
  }
  .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .icon-btn.spinning :global(svg) { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* Empty State */
  .empty-state { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    padding: 4rem 2rem; 
    text-align: center; 
  }
  .empty-state p { 
    margin: 1rem 0 0.5rem; 
    font-size: 1.125rem; 
    color: var(--text-secondary); 
  }
  .empty-hint { 
    font-size: 0.875rem; 
    color: var(--text-muted); 
    margin-bottom: 1.5rem; 
  }
  .loading { 
    text-align: center; 
    padding: 3rem; 
    color: var(--text-muted); 
  }

  /* Wallet Grid */
  .wallet-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
    gap: 1rem; 
  }
  .wallet-card { 
    background: var(--card-bg); 
    border: 1px solid var(--border-primary); 
    border-radius: 12px; 
    padding: 1.25rem; 
    transition: border-color 0.15s; 
  }
  .wallet-card:hover { border-color: var(--border-secondary); }
  .wallet-card-header { 
    display: flex; 
    align-items: flex-start; 
    gap: 0.75rem; 
    margin-bottom: 1rem; 
  }
  .wallet-icon { 
    width: 40px; 
    height: 40px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    background: var(--accent-bg); 
    border-radius: 10px; 
  }
  .wallet-meta { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    gap: 0.125rem; 
  }
  .wallet-name { 
    font-weight: 600; 
    color: var(--text-primary); 
  }
  .wallet-owner { 
    font-size: 0.8125rem; 
    color: var(--text-muted); 
  }
  .wallet-actions { display: flex; gap: 0.375rem; }
  .wallet-card-body { 
    display: flex; 
    justify-content: space-between; 
    align-items: baseline; 
  }
  .wallet-balance { 
    font-size: 1.375rem; 
    font-weight: 600; 
    color: var(--accent); 
  }
  .wallet-type { 
    font-size: 0.75rem; 
    color: var(--text-disabled); 
    background: var(--bg-tertiary); 
    padding: 0.25rem 0.5rem; 
    border-radius: 4px; 
  }
  .wallet-syncing { 
    margin-top: 0.75rem; 
    font-size: 0.8125rem; 
    color: var(--accent); 
  }

  /* Transaction Table */
  .tx-table { 
    background: var(--card-bg); 
    border: 1px solid var(--border-primary); 
    border-radius: 12px; 
    overflow: hidden; 
  }
  .tx-header { 
    display: flex; 
    gap: 0.75rem; 
    padding: 0.75rem 1rem; 
    background: var(--bg-primary); 
    border-bottom: 1px solid var(--border-primary); 
  }
  .tx-th { 
    font-size: 0.75rem; 
    font-weight: 600; 
    color: var(--text-muted); 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    background: none; 
    border: none; 
    padding: 0; 
    text-align: left; 
  }
  .tx-th.sortable { cursor: pointer; transition: color 0.15s; }
  .tx-th.sortable:hover { color: var(--text-secondary); }
  .tx-body { max-height: 600px; overflow-y: auto; }
  .tx-row { 
    display: flex; 
    gap: 0.75rem; 
    align-items: center; 
    padding: 0.75rem 1rem; 
    border-bottom: 1px solid var(--bg-tertiary); 
    transition: background 0.1s; 
  }
  .tx-row:hover { background: var(--bg-primary); }
  .tx-row:last-child { border-bottom: none; }

  /* Transaction table column widths - with fiat */
  .tx-header .tx-th:nth-child(1), .tx-row .tx-cell:nth-child(1) { width: 95px; flex-shrink: 0; } /* Date */
  .tx-header .tx-th:nth-child(2), .tx-row .tx-cell:nth-child(2) { width: 105px; flex-shrink: 0; } /* Amount */

  .tx-header.has-fiat .tx-th:nth-child(3), .tx-row.has-fiat .tx-cell:nth-child(3) { width: 70px; flex-shrink: 0; } /* Fiat */
  .tx-header.has-fiat .tx-th:nth-child(4), .tx-row.has-fiat .tx-cell:nth-child(4) { width: 80px; flex-shrink: 0; } /* Fee */
  .tx-header.has-fiat .tx-th:nth-child(5), .tx-row.has-fiat .tx-cell:nth-child(5) { flex: 1; min-width: 70px; } /* Wallet */
  .tx-header.has-fiat .tx-th:nth-child(6), .tx-row.has-fiat .tx-cell:nth-child(6) { width: 105px; flex-shrink: 0; } /* Category */
  .tx-header.has-fiat .tx-th:nth-child(7), .tx-row.has-fiat .tx-cell:nth-child(7) { width: 100px; flex-shrink: 0; } /* Note */
  .tx-header.has-fiat .tx-th:nth-child(8), .tx-row.has-fiat .tx-cell:nth-child(8) { width: 65px; flex-shrink: 0; } /* ID */
  .tx-header.has-fiat .tx-th:nth-child(9), .tx-row.has-fiat .tx-cell:nth-child(9) { width: 80px; flex-shrink: 0; } /* Actions */

  /* Transaction table column widths - without fiat */
  .tx-header:not(.has-fiat) .tx-th:nth-child(3), .tx-row:not(.has-fiat) .tx-cell:nth-child(3) { width: 80px; flex-shrink: 0; } /* Fee */
  .tx-header:not(.has-fiat) .tx-th:nth-child(4), .tx-row:not(.has-fiat) .tx-cell:nth-child(4) { flex: 1; min-width: 70px; } /* Wallet */
  .tx-header:not(.has-fiat) .tx-th:nth-child(5), .tx-row:not(.has-fiat) .tx-cell:nth-child(5) { width: 105px; flex-shrink: 0; } /* Category */
  .tx-header:not(.has-fiat) .tx-th:nth-child(6), .tx-row:not(.has-fiat) .tx-cell:nth-child(6) { width: 100px; flex-shrink: 0; } /* Note */
  .tx-header:not(.has-fiat) .tx-th:nth-child(7), .tx-row:not(.has-fiat) .tx-cell:nth-child(7) { width: 65px; flex-shrink: 0; } /* ID */
  .tx-header:not(.has-fiat) .tx-th:nth-child(8), .tx-row:not(.has-fiat) .tx-cell:nth-child(8) { width: 80px; flex-shrink: 0; } /* Actions */

  /* ID cell styling */
  .tx-id {
    font-size: 0.75rem;
    font-family: "SF Mono", Monaco, monospace;
  }

  .tx-id a {
    color: var(--accent);
    text-decoration: none;
  }

  .tx-id a:hover {
    text-decoration: underline;
  }

  .tx-id span {
    color: var(--text-muted);
  }

  /* Duplicate info in modal */
  .duplicate-info {
    background: var(--accent-bg);
    border: 1px solid rgba(247, 147, 26, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .duplicate-info p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .tx-date { font-size: 0.8125rem; color: var(--text-muted); }
  .tx-amount { font-family: "SF Mono", Monaco, monospace; font-weight: 600; font-size: 0.8125rem; }
  .tx-amount.positive { color: var(--positive); }
  .tx-amount.negative { color: var(--negative); }
  .tx-fiat { font-family: "SF Mono", Monaco, monospace; font-size: 0.75rem; }
  .tx-fiat.positive { color: var(--positive); }
  .tx-fiat.negative { color: var(--negative); }
  .tx-wallet { font-size: 0.875rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  .tx-category select, .tx-note input { 
    background: var(--bg-input); 
    border: 1px solid var(--border-primary); 
    border-radius: 6px; 
    padding: 0.375rem 0.5rem; 
    color: var(--text-primary); 
    font-size: 0.8125rem; 
    width: 100%; 
  }
  .tx-category select:focus, .tx-note input:focus { 
    outline: none; 
    border-color: var(--border-hover); 
  }
  
  .tx-fee {
    font-size: 0.75rem;
    color: var(--negative);
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .tx-fee .fee-btc { color: var(--negative); }
  .tx-fee .fee-fiat { color: var(--warning); font-size: 0.6875rem; }

  .tx-actions { display: flex; align-items: center; gap: 0.375rem; }
  .tx-actions a { font-size: 0.75rem; color: var(--accent); text-decoration: none; }
  .tx-actions a:hover { text-decoration: underline; }
  .tx-action-btn { 
    background: none; 
    border: 1px solid var(--border-secondary); 
    border-radius: 4px; 
    color: var(--text-muted); 
    width: 24px; 
    height: 24px; 
    font-size: 0.75rem; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.15s; 
  }
  .tx-action-btn:hover { 
    background: var(--bg-tertiary); 
    color: var(--accent); 
    border-color: var(--accent); 
  }
  .tx-action-btn.danger:hover { 
    color: var(--negative); 
    border-color: var(--negative); 
    background: rgba(248, 113, 113, 0.1); 
  }

  /* Form */
  .form-group { margin-bottom: 1rem; }
  .form-group label { 
    display: block; 
    margin-bottom: 0.5rem; 
    font-size: 0.8125rem; 
    font-weight: 500; 
    color: var(--text-secondary); 
  }
  .form-group input, .form-group select { 
    width: 100%; 
    background: var(--card-bg); 
    border: 1px solid var(--border-secondary); 
    border-radius: 8px; 
    padding: 0.75rem; 
    color: var(--text-primary); 
    font-size: 0.9375rem; 
    box-sizing: border-box; 
  }
  .form-group input:focus, .form-group select:focus { 
    outline: none; 
    border-color: var(--accent); 
  }
  .form-row-modal { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  .form-hint { display: block; margin-top: 0.375rem; font-size: 0.75rem; color: var(--text-muted); }

  /* Stats Grid */
  .stats-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 1rem; 
    margin-bottom: 1.5rem; 
  }
  .stat-card { 
    background: var(--card-bg); 
    border: 1px solid var(--border-primary); 
    border-radius: 12px; 
    padding: 1.25rem; 
    display: flex; 
    flex-direction: column; 
    gap: 0.5rem; 
  }
  .stat-label { 
    font-size: 0.75rem; 
    color: var(--text-muted); 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
  }
  .stat-value { 
    font-size: 1.5rem; 
    font-weight: 600; 
    color: var(--text-primary); 
  }
  .stat-value.primary { color: var(--accent); }
  .stat-value.positive { color: var(--positive); }
  .stat-value.negative { color: var(--negative); }
  .stat-value.muted { color: var(--text-disabled); font-size: 1rem; }
  .stat-card .stat-sub { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem; }
  .stat-sub-holdings { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
  .fiat-holding { 
    font-size: 0.875rem; 
    padding: 0.125rem 0.375rem; 
    background: var(--bg-tertiary); 
    border-radius: 4px; 
  }
  .fiat-holding.positive { color: var(--positive); }
  .fiat-holding.negative { color: var(--negative); }

  /* Charts */
  .charts-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
    gap: 1rem; 
    margin-bottom: 1rem; 
  }
  .chart-card { 
    background: var(--card-bg); 
    border: 1px solid var(--border-primary); 
    border-radius: 12px; 
    padding: 1.25rem; 
  }
  .chart-card.full-width { grid-column: 1 / -1; }
  .chart-card h2 { 
    margin: 0 0 1rem; 
    font-size: 0.875rem; 
    font-weight: 600; 
    color: var(--text-secondary); 
  }
  .chart-empty { 
    height: 150px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: var(--text-disabled); 
    font-size: 0.875rem; 
  }
  .recent-list { display: flex; flex-direction: column; }
  .recent-item { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 0.75rem 0; 
    border-bottom: 1px solid var(--border-primary); 
  }
  .recent-item:last-child { border-bottom: none; }
  .recent-info { display: flex; flex-direction: column; gap: 0.125rem; }
  .recent-category { font-size: 0.9375rem; color: var(--text-primary); }
  .recent-date { font-size: 0.75rem; color: var(--text-muted); }
  .recent-amount { font-family: "SF Mono", Monaco, monospace; font-weight: 600; font-size: 0.9375rem; }
  .recent-amount.positive { color: var(--positive); }
  .recent-amount.negative { color: var(--negative); }

  /* Filters */
  .filters { display: flex; align-items: center; gap: 0.5rem; }
  .filter-select { 
    background: var(--bg-tertiary); 
    border: 1px solid var(--border-secondary); 
    border-radius: 6px; 
    padding: 0.5rem 0.75rem; 
    color: var(--text-primary); 
    font-size: 0.8125rem; 
    cursor: pointer; 
  }
  .filter-select:focus { outline: none; border-color: var(--accent); }
  .btn-clear { 
    background: none; 
    border: 1px solid var(--border-hover); 
    border-radius: 6px; 
    padding: 0.5rem 0.75rem; 
    color: var(--text-secondary); 
    font-size: 0.8125rem; 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .btn-clear:hover { border-color: var(--negative); color: var(--negative); }

  /* Toggle */
  .fiat-toggle { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .toggle-label { color: var(--text-secondary); font-size: 0.9375rem; }
  .toggle-btn { 
    width: 44px; 
    height: 24px; 
    background: var(--border-hover); 
    border: none; 
    border-radius: 12px; 
    cursor: pointer; 
    position: relative; 
    transition: background 0.2s; 
  }
  .toggle-btn.active { background: var(--accent); }
  .toggle-knob { 
    position: absolute; 
    top: 2px; 
    left: 2px; 
    width: 20px; 
    height: 20px; 
    background: #fff; 
    border-radius: 50%; 
    transition: transform 0.2s; 
  }
  .toggle-btn.active .toggle-knob { transform: translateX(20px); }

  .toggle-group { 
    display: flex; 
    background: var(--bg-tertiary); 
    border-radius: 8px; 
    padding: 3px; 
  }
  .toggle-option { 
    padding: 0.5rem 1rem; 
    background: transparent; 
    border: none; 
    border-radius: 6px; 
    color: var(--text-secondary); 
    font-size: 0.875rem; 
    font-weight: 500; 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .toggle-option:hover { color: var(--text-primary); }
  .toggle-option.active { background: var(--accent); color: #000; }

  .fiat-currency-select { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .price-info { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: var(--text-secondary); }
  .price-time { font-size: 0.75rem; color: var(--text-muted); }
  .fetch-fiat-btn { margin-top: 0.75rem; width: 100%; justify-content: center; }
  .fetch-fiat-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .spinner { 
    width: 14px; 
    height: 14px; 
    border: 2px solid var(--border-hover); 
    border-top-color: var(--text-primary); 
    border-radius: 50%; 
    animation: spin 0.8s linear infinite; 
    margin-right: 0.5rem; 
  }
  .spinner.large { width: 32px; height: 32px; border-width: 3px; }

  /* Transaction type toggle */
  .tx-type-toggle { 
    display: flex; 
    gap: 0; 
    margin-bottom: 1.25rem; 
    background: var(--bg-tertiary); 
    border-radius: 8px; 
    padding: 4px; 
  }
  .type-btn { 
    flex: 1; 
    padding: 0.625rem 1rem; 
    background: transparent; 
    border: none; 
    border-radius: 6px; 
    color: var(--text-secondary); 
    font-size: 0.875rem; 
    font-weight: 500; 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .type-btn:hover { color: var(--text-primary); }
  .type-btn.active { background: var(--accent); color: #000; }
  .type-btn.small { padding: 0.5rem 0.75rem; font-size: 0.8125rem; }
  .currency-toggle { 
    display: flex; 
    gap: 0; 
    background: var(--bg-tertiary); 
    border-radius: 8px; 
    padding: 4px; 
  }
  .wallet-type-toggle { 
    display: flex; 
    gap: 0; 
    background: var(--bg-tertiary); 
    border-radius: 8px; 
    padding: 4px; 
  }
  .manual-wallet-info { 
    background: var(--accent-bg); 
    border: 1px solid rgba(247, 147, 26, 0.2); 
    border-radius: 8px; 
    padding: 0.875rem; 
    margin-bottom: 1rem; 
  }
  .manual-wallet-info p { margin: 0 0 0.5rem; font-size: 0.8125rem; color: var(--text-secondary); }
  .manual-wallet-info p:last-child { margin-bottom: 0; }

  /* Confirm content */
  .confirm-content { margin-bottom: 1rem; }
  .confirm-message { font-size: 1rem; color: var(--text-primary); margin: 0 0 0.75rem; }
  .confirm-detail { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 0.75rem; }
  .confirm-question { font-size: 0.9375rem; color: var(--text-primary); margin: 0 0 0.5rem; }
  .confirm-warning { 
    font-size: 0.8125rem; 
    color: var(--accent); 
    margin: 0; 
    padding: 0.75rem; 
    background: var(--accent-bg); 
    border-radius: 6px; 
  }
  .form-actions.three-buttons { display: flex; gap: 0.5rem; }
  .form-actions.three-buttons .btn { flex: 1; justify-content: center; padding: 0.625rem 0.75rem; font-size: 0.8125rem; }

  /* CSV Import */
  .import-upload { min-height: 150px; }
  .file-upload { margin-top: 1rem; }
  .file-upload-label { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    gap: 0.75rem; 
    padding: 2rem; 
    border: 2px dashed var(--border-hover); 
    border-radius: 12px; 
    cursor: pointer; 
    transition: all 0.15s; 
  }
  .file-upload-label:hover { 
    border-color: var(--accent); 
    background: var(--accent-bg); 
  }
  .file-upload-label input { display: none; }
  .file-upload-btn { 
    padding: 0.625rem 1.25rem; 
    background: var(--bg-tertiary); 
    border: 1px solid var(--border-hover); 
    border-radius: 8px; 
    color: var(--text-primary); 
    font-weight: 500; 
  }
  .file-upload-hint { font-size: 0.75rem; color: var(--text-muted); }
  .import-summary { 
    background: var(--bg-primary); 
    border-radius: 8px; 
    padding: 1rem; 
    margin-bottom: 1rem; 
  }
  .import-summary p { margin: 0.25rem 0; font-size: 0.875rem; color: var(--text-secondary); }
  .import-summary strong { color: var(--text-primary); }
  .import-warnings { 
    background: rgba(251, 191, 36, 0.1); 
    border: 1px solid rgba(251, 191, 36, 0.3); 
    border-radius: 8px; 
    padding: 0.75rem; 
    margin-bottom: 1rem; 
  }
  .warning-title { margin: 0 0 0.5rem; font-size: 0.8125rem; font-weight: 600; color: var(--warning); }
  .warning-text { margin: 0.25rem 0; font-size: 0.75rem; color: var(--warning); }
  .import-errors { 
    background: rgba(248, 113, 113, 0.1); 
    border: 1px solid rgba(248, 113, 113, 0.3); 
    border-radius: 8px; 
    padding: 0.75rem; 
    margin-bottom: 1rem; 
  }
  .error-title { margin: 0 0 0.5rem; font-size: 0.8125rem; font-weight: 600; color: var(--negative); }
  .error-text { margin: 0.25rem 0; font-size: 0.75rem; color: var(--negative); }
  .import-table { 
    border: 1px solid var(--border-primary); 
    border-radius: 8px; 
    overflow: hidden; 
    max-height: 250px; 
    overflow-y: auto; 
  }
  .import-table-header { 
    display: grid; 
    grid-template-columns: 90px 110px 100px 1fr; 
    gap: 0.5rem; 
    padding: 0.5rem 0.75rem; 
    background: var(--bg-primary); 
    font-size: 0.6875rem; 
    font-weight: 600; 
    color: var(--text-muted); 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
  }
  .import-table-body { font-size: 0.8125rem; }
  .import-table-row { 
    display: grid; 
    grid-template-columns: 90px 110px 100px 1fr; 
    gap: 0.5rem; 
    padding: 0.5rem 0.75rem; 
    border-bottom: 1px solid var(--bg-tertiary); 
  }
  .import-table-row:last-child { border-bottom: none; }
  .import-table-row .positive { color: var(--positive); }
  .import-table-row .negative { color: var(--negative); }
  .import-table-row .truncate { 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    color: var(--text-muted); 
  }
  .import-table-more { 
    padding: 0.75rem; 
    text-align: center; 
    font-size: 0.75rem; 
    color: var(--text-muted); 
    background: var(--bg-primary); 
  }
  .import-progress { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    padding: 3rem; 
    gap: 1rem; 
  }
  .import-progress p { color: var(--text-secondary); margin: 0; }
  .import-done { padding: 1rem 0; }
  .import-result { 
    background: var(--bg-primary); 
    border-radius: 8px; 
    padding: 1rem; 
    margin-bottom: 1rem; 
  }
  .import-result p { margin: 0.5rem 0; font-size: 1rem; }
  .result-success { color: var(--positive); }
  .result-skipped { color: var(--text-secondary); }
  .result-errors { color: var(--negative); }

  /* Wallet Groups */
  .wallet-groups {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .wallet-type-section {
    background: var(--card-bg);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    overflow: hidden;
  }

  .type-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--bg-primary);
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .type-header:hover {
    background: var(--bg-hover);
  }

  .collapse-icon {
    color: var(--text-muted);
    font-size: 0.75rem;
    width: 1rem;
  }

  .collapse-icon.small {
    font-size: 0.625rem;
  }

  .type-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
    text-align: left;
  }

  .type-balance {
    font-size: 1rem;
    font-weight: 600;
    color: var(--accent);
    font-family: "SF Mono", Monaco, monospace;
  }

  .type-content {
    padding: 0.5rem;
  }

  .empty-type {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  /* Entity Section */
  .entity-section {
    margin: 0.5rem;
    background: var(--bg-primary);
    border-radius: 8px;
    overflow: hidden;
  }

  .entity-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .entity-header:hover {
    background: var(--card-bg);
  }

  .entity-name {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-secondary);
    flex: 1;
    text-align: left;
  }

  .entity-balance {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--accent);
    font-family: "SF Mono", Monaco, monospace;
  }

  .entity-content {
    padding: 0.5rem 0.75rem 0.75rem;
  }

  .empty-entity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .btn-add-small {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: transparent;
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add-small:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* Wallet grid inside groups - smaller cards */
  .entity-content .wallet-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.75rem;
  }

  .entity-content .wallet-card {
    padding: 1rem;
  }

  .entity-content .wallet-card-header {
    margin-bottom: 0.75rem;
  }

  .entity-content .wallet-balance {
    font-size: 1.125rem;
  }

  /* Settings Layout */
  .settings-layout {
    display: flex;
    gap: 2rem;
    min-height: calc(100vh - 250px);
  }

  .settings-sidebar {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .settings-nav-item {
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 0.9375rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }

  .settings-nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .settings-nav-item.active {
    background: var(--accent-bg);
    color: var(--accent);
  }

  .settings-content {
    flex: 1;
    min-width: 0;
  }

  .settings-section {
    background: var(--card-bg);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .settings-section h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .section-description {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    margin-bottom: 0.25rem;
  }

  .section-header .section-description {
    margin-bottom: 0;
  }

  /* Setting Rows */
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border-primary);
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-row.column {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .setting-label {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .setting-description {
    font-size: 0.8125rem;
    color: var(--text-muted);
    max-width: 400px;
  }

  .setting-control {
    flex-shrink: 0;
  }

  .setting-action {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Price Badge */
  .price-badge {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .price-badge .price-time {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  /* Account Groups */
  .account-group {
    margin-top: 1.5rem;
  }

  .account-group:first-of-type {
    margin-top: 1rem;
  }

  .account-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .account-group-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .account-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .account-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border-radius: 8px;
  }

  .account-name {
    flex: 1;
    font-size: 0.9375rem;
    color: var(--text-primary);
  }

  .account-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-tertiary);
    border-radius: 4px;
    color: var(--text-muted);
  }

  .account-badge.primary {
    background: var(--accent-bg);
    color: var(--accent);
  }

  /* Wallet List */
  .wallet-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .wallet-list-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 8px;
  }

  .wallet-list-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .wallet-list-name {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .wallet-list-meta {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .wallet-list-balance {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--accent);
    font-family: "SF Mono", Monaco, monospace;
  }

  .wallet-list-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* Button Styles */
  .btn-add-inline {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add-inline:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn-icon-small {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    color: var(--text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-icon-small:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn-icon-small.danger:hover {
    border-color: var(--negative);
    color: var(--negative);
    background: rgba(248, 113, 113, 0.1);
  }

  /* Danger Zone */
  .danger-zone {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(220, 38, 38, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 8px;
  }

  .danger-zone .setting-label {
    color: var(--negative);
  }

  /* Empty List */
  .empty-list {
    padding: 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
    background: var(--bg-primary);
    border-radius: 8px;
  }

  /* Global color classes */
  .positive { color: var(--positive); }
  .negative { color: var(--negative); }

  /* Responsive */
  @media (max-width: 768px) {
    .settings-layout {
      flex-direction: column;
    }
    
    .settings-sidebar {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
    }
    
    .settings-nav-item {
      white-space: nowrap;
    }
    
    .setting-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    
    .setting-description {
      max-width: none;
    }

    header {
      padding: 1rem;
    }

    main {
      padding: 1rem;
      padding-top: 170px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .wallet-grid {
      grid-template-columns: 1fr;
    }
  }

  .tx-date {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .tx-date .date-main {
    font-size: 0.8125rem;
    color: var(--text-secondary);
  }

  .tx-date .date-time {
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-family: "SF Mono", Monaco, monospace;
  }

  /* Category Groups */
.category-group {
  margin-top: 1.5rem;
}

.category-group:first-of-type {
  margin-top: 1rem;
}

.category-group h3 {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
}

.category-item.system {
  opacity: 0.7;
}

.category-name {
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.category-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-muted);
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

/* Unlock Screen */
.unlock-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.unlock-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  text-align: center;
}

.unlock-logo {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.unlock-logo .logo-sat { color: var(--accent); }
.unlock-logo .logo-stone { color: var(--text-primary); }

.unlock-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.unlock-subtitle {
  color: var(--text-muted);
  margin: 0 0 1.5rem;
}

.unlock-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 4px;
}

.unlock-tab {
  flex: 1;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.unlock-tab:hover {
  color: var(--text-secondary);
}

.unlock-tab.active {
  background: var(--accent);
  color: #000;
}

.unlock-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.unlock-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  text-align: center;
}

.unlock-input:focus {
  outline: none;
  border-color: var(--accent);
}

.unlock-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9375rem;
  resize: none;
  font-family: "SF Mono", Monaco, monospace;
}

.unlock-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.unlock-btn {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

.unlock-error {
  color: var(--negative);
  font-size: 0.875rem;
  margin: 0.5rem 0 0;
}

.unlock-hint {
  color: var(--text-muted);
  font-size: 0.8125rem;
  margin-top: 1.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.link-btn:hover {
  color: var(--accent-hover);
}

.unlock-loading {
  color: var(--text-muted);
  margin-top: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-secondary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Security Settings */
.encryption-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.encryption-badge.active {
  background: rgba(74, 222, 128, 0.1);
  color: var(--positive);
}

.encryption-badge.inactive {
  background: rgba(248, 113, 113, 0.1);
  color: var(--negative);
}

.settings-select {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
}

.settings-select:focus {
  outline: none;
  border-color: var(--accent);
}

/* Encryption Setup Modal */
.encryption-warning {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.encryption-warning.danger {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.3);
}

.encryption-warning .warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.encryption-warning p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: left;
}

.encryption-warning strong {
  color: var(--text-primary);
}

/* Password Strength */
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
  border-radius: 3px;
}

.strength-fill.very-weak { background: #ef4444; }
.strength-fill.weak { background: #f97316; }
.strength-fill.fair { background: #eab308; }
.strength-fill.strong { background: #22c55e; }
.strength-fill.very-strong { background: #10b981; }

.strength-label {
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 70px;
}

.strength-label.very-weak { color: #ef4444; }
.strength-label.weak { color: #f97316; }
.strength-label.fair { color: #eab308; }
.strength-label.strong { color: #22c55e; }
.strength-label.very-strong { color: #10b981; }

.form-error {
  color: var(--negative);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Recovery Phrase Display */
.recovery-section {
  margin-bottom: 1rem;
}

.recovery-warning {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(247, 147, 26, 0.1);
  border: 1px solid rgba(247, 147, 26, 0.3);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.recovery-warning .warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.recovery-warning p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: left;
}

.recovery-phrase-display {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.recovery-words {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.recovery-word {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.word-number {
  color: var(--text-muted);
  font-size: 0.75rem;
  min-width: 1.25rem;
}

.word-text {
  color: var(--text-primary);
  font-family: "SF Mono", Monaco, monospace;
  font-size: 0.875rem;
}

.copy-btn {
  width: 100%;
}

.recovery-confirm {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--accent);
  cursor: pointer;
}

.checkbox-label span {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: left;
}
</style>