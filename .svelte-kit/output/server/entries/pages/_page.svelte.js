import { w as attr_class, x as bind_props, y as attr, z as stringify, F as attr_style, G as ensure_array_like } from "../../chunks/index.js";
import { invoke } from "@tauri-apps/api/core";
import { e as escape_html } from "../../chunks/context.js";
import "clsx";
function Modal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { title, open, onclose, children } = $$props;
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="modal-overlay svelte-ta60gp" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal svelte-ta60gp"><div class="modal-header svelte-ta60gp"><h2 id="modal-title" class="svelte-ta60gp">${escape_html(title)}</h2> <button class="close-btn svelte-ta60gp" aria-label="Close modal">×</button></div> <div class="modal-content svelte-ta60gp">`);
      children($$renderer2);
      $$renderer2.push(`<!----></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Dropdown($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { options, value = void 0, placeholder = "Select..." } = $$props;
    let open = false;
    function getSelectedLabel() {
      const selected = options.find((o) => o.value === value);
      return selected?.label || placeholder;
    }
    $$renderer2.push(`<div class="dropdown svelte-1fd3ybn"><button class="dropdown-trigger svelte-1fd3ybn"><span class="dropdown-value svelte-1fd3ybn">${escape_html(getSelectedLabel())}</span> <svg${attr_class("dropdown-arrow svelte-1fd3ybn", void 0, { "open": open })} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
function X($$renderer, $$props) {
  let { size = 20, color = "currentColor" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none"${attr("stroke", color)} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`);
}
function ConfirmDelete($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { open = false, name } = $$props;
    let inputValue = "";
    const expectedValue = `delete ${name}`;
    const isValid = inputValue.toLowerCase() === expectedValue.toLowerCase();
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="overlay svelte-a254c7"><div class="modal svelte-a254c7"><div class="modal-header svelte-a254c7"><h2 class="svelte-a254c7">Delete Wallet</h2> <button class="close-btn svelte-a254c7">`);
      X($$renderer2, { size: 20 });
      $$renderer2.push(`<!----></button></div> <div class="modal-body svelte-a254c7"><p class="warning svelte-a254c7">This action cannot be undone. All transaction data for this wallet will be permanently deleted.</p> <div class="confirm-input svelte-a254c7"><label class="svelte-a254c7">Type <span class="confirm-text svelte-a254c7">delete ${escape_html(name)}</span> to confirm:</label> <input type="text"${attr("value", inputValue)}${attr("placeholder", `delete ${stringify(name)}`)} class="svelte-a254c7"/></div> <div class="form-actions svelte-a254c7"><button class="btn secondary svelte-a254c7">Cancel</button> <button class="btn danger svelte-a254c7"${attr("disabled", !isValid, true)}>Delete Wallet</button></div></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Refresh($$renderer, $$props) {
  let { size = 20, color = "currentColor" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none"${attr("stroke", color)} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 4v5h-5"></path></svg>`);
}
function Bitcoin($$renderer, $$props) {
  let { size = 20, color = "currentColor" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none"${attr("stroke", color)} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5v14"></path><path d="M12 5v14"></path><path d="M9 5h4.5a3 3 0 0 1 0 6H9"></path><path d="M9 11h5a3.5 3.5 0 0 1 0 7H9"></path><path d="M9 8h6"></path><path d="M9 16h6"></path></svg>`);
}
function ConfirmDialog($$renderer, $$props) {
  let {
    open = false,
    title = "Confirm",
    message = "Are you sure?",
    confirmText = "Confirm",
    danger = false,
    onconfirm,
    onclose
  } = $$props;
  if (open) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="overlay svelte-7e0w24"><div class="modal svelte-7e0w24"><div class="modal-header svelte-7e0w24"><h2${attr_class("svelte-7e0w24", void 0, { "danger": danger })}>${escape_html(title)}</h2> <button class="close-btn svelte-7e0w24">`);
    X($$renderer, { size: 20 });
    $$renderer.push(`<!----></button></div> <div class="modal-body svelte-7e0w24"><p class="svelte-7e0w24">${escape_html(message)}</p> <div class="form-actions svelte-7e0w24"><button class="btn secondary svelte-7e0w24">Cancel</button> <button${attr_class("btn svelte-7e0w24", void 0, { "danger": danger })}>${escape_html(confirmText)}</button></div></div></div></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
function BarChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, height = 200 } = $$props;
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const barWidth = data.length > 0 ? Math.min(40, 100 / data.length - 2) : 40;
    $$renderer2.push(`<div class="chart svelte-9fnibp"${attr_style(`height: ${stringify(height)}px`)}>`);
    if (data.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="empty svelte-9fnibp">No data</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bars svelte-9fnibp"><!--[-->`);
      const each_array = ensure_array_like(data);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let item = each_array[i];
        $$renderer2.push(`<div class="bar-container svelte-9fnibp"${attr_style(`width: ${stringify(barWidth)}%`)}><div class="bar-wrapper svelte-9fnibp"><div class="bar svelte-9fnibp"${attr_style(`height: ${stringify(item.value / maxValue * 100)}%; background: ${stringify(item.color || "#f7931a")}`)}></div></div> <span class="bar-label svelte-9fnibp">${escape_html(item.label)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function PieChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, size = 180 } = $$props;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const segments = (() => {
      let currentAngle = 0;
      return data.map((item) => {
        const angle = total > 0 ? item.value / total * 360 : 0;
        const segment = {
          ...item,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
          percentage: total > 0 ? item.value / total * 100 : 0
        };
        currentAngle += angle;
        return segment;
      });
    })();
    function describeArc(startAngle, endAngle, radius) {
      const start = polarToCartesian(radius, endAngle);
      const end = polarToCartesian(radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M",
        radius,
        radius,
        "L",
        start.x,
        start.y,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
        "Z"
      ].join(" ");
    }
    function polarToCartesian(radius, angle) {
      const rad = (angle - 90) * Math.PI / 180;
      return {
        x: radius + radius * Math.cos(rad),
        y: radius + radius * Math.sin(rad)
      };
    }
    $$renderer2.push(`<div class="pie-chart svelte-6s3h9y">`);
    if (data.length === 0 || total === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="empty svelte-6s3h9y"${attr_style(`width: ${stringify(size)}px; height: ${stringify(size)}px`)}>No data</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg${attr("width", size)}${attr("height", size)}${attr("viewBox", `0 0 ${stringify(size)} ${stringify(size)}`)} class="svelte-6s3h9y"><!--[-->`);
      const each_array = ensure_array_like(segments);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let segment = each_array[$$index];
        if (segment.percentage > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<path${attr("d", describeArc(segment.startAngle, segment.endAngle, size / 2))}${attr("fill", segment.color)}></path>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--><circle${attr("cx", size / 2)}${attr("cy", size / 2)}${attr("r", size / 4)} fill="#111"></circle></svg>`);
    }
    $$renderer2.push(`<!--]--> <div class="legend svelte-6s3h9y"><!--[-->`);
    const each_array_1 = ensure_array_like(segments.filter((s) => s.percentage > 0));
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let segment = each_array_1[$$index_1];
      $$renderer2.push(`<div class="legend-item svelte-6s3h9y"><span class="legend-dot svelte-6s3h9y"${attr_style(`background: ${stringify(segment.color)}`)}></span> <span class="legend-label svelte-6s3h9y">${escape_html(segment.label)}</span> <span class="legend-value svelte-6s3h9y">${escape_html(segment.percentage.toFixed(0))}%</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function LineChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data = [], height = 200 } = $$props;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    let width = 400;
    let chartWidth = width - padding.left - padding.right;
    let chartHeight = height - padding.top - padding.bottom;
    let minValue = Math.min(...data.map((d) => d.value), 0);
    let maxValue = Math.max(...data.map((d) => d.value));
    let valueRange = maxValue - minValue || 1;
    function getX(index) {
      if (data.length <= 1) return padding.left + chartWidth / 2;
      return padding.left + index / (data.length - 1) * chartWidth;
    }
    function getY(value) {
      return padding.top + chartHeight - (value - minValue) / valueRange * chartHeight;
    }
    let pathD = (() => {
      if (data.length === 0) return "";
      return data.map((d, i) => {
        const x = getX(i);
        const y = getY(d.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      }).join(" ");
    })();
    let areaD = (() => {
      if (data.length === 0) return "";
      const baseline = getY(minValue);
      const linePath = data.map((d, i) => {
        const x = getX(i);
        const y = getY(d.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      }).join(" ");
      return `${linePath} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`;
    })();
    function formatValue(val) {
      if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + "M";
      if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(0) + "k";
      return val.toLocaleString();
    }
    let yTicks = (() => {
      const ticks = [];
      const step = valueRange / 4;
      for (let i = 0; i <= 4; i++) {
        ticks.push(minValue + step * i);
      }
      return ticks;
    })();
    $$renderer2.push(`<div class="line-chart svelte-1srghcq"><svg${attr("width", width)}${attr("height", height)} class="svelte-1srghcq"><defs><linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#f7931a;stop-opacity:0.3"></stop><stop offset="100%" style="stop-color:#f7931a;stop-opacity:0.05"></stop></linearGradient></defs><!--[-->`);
    const each_array = ensure_array_like(yTicks);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tick = each_array[$$index];
      $$renderer2.push(`<line${attr("x1", padding.left)}${attr("y1", getY(tick))}${attr("x2", width - padding.right)}${attr("y2", getY(tick))} stroke="#1a1a1a" stroke-dasharray="2,2"></line><text${attr("x", padding.left - 8)}${attr("y", getY(tick))} text-anchor="end" dominant-baseline="middle" fill="#555" font-size="10">${escape_html(formatValue(tick))}</text>`);
    }
    $$renderer2.push(`<!--]-->`);
    if (data.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<path${attr("d", areaD)} fill="url(#areaGradient)"></path>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if (data.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<path${attr("d", pathD)} fill="none" stroke="#f7931a" stroke-width="2"></path>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_1 = ensure_array_like(data);
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      let point = each_array_1[i];
      $$renderer2.push(`<circle${attr("cx", getX(i))}${attr("cy", getY(point.value))} r="3" fill="#f7931a"></circle>`);
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_2 = ensure_array_like(data);
    for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
      let point = each_array_2[i];
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<text${attr("x", getX(i))}${attr("y", height - 8)} text-anchor="middle" fill="#555" font-size="10">${escape_html(point.label)}</text>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></svg></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let categories = [];
    let showAddCategory = false;
    let newCategoryName = "";
    let showEditCategory = false;
    let editCategoryName = "";
    let showDeleteCategory = false;
    let categoryToDelete = null;
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
    let entities = [];
    let wallets = [];
    let transactions = [];
    let balances = {};
    let walletIsManual = false;
    let message = "";
    let messageType = "info";
    let activeTab = "dashboard";
    let selectedEntityId = null;
    let selectedWalletId = null;
    let filterYear = null;
    let filterMonth = null;
    let appLocked = true;
    let dbEncrypted = false;
    let checkingEncryption = true;
    let unlockPassphrase = "";
    let unlockMode = "passphrase";
    let showEncryptionSetup = false;
    let encryptPassphrase = "";
    let encryptPassphraseConfirm = "";
    let encryptRecoveryPhrase = "";
    let recoveryPhraseConfirmed = false;
    let encryptionStep = "passphrase";
    let passwordStrength = null;
    let showChangePassphrase = false;
    let currentPassphrase = "";
    let newPassphrase = "";
    let newPassphraseConfirm = "";
    let newPasswordStrength = null;
    let showRemoveEncryption = false;
    let removeEncryptionPassphrase = "";
    let autoLockTime = "never";
    let lastActivityTime = Date.now();
    let autoLockInterval = null;
    let showAddWallet = false;
    let showAddEntity = false;
    let showDeleteWallet = false;
    let showDeleteEntity = false;
    let entityToDelete = null;
    let showEditWallet = false;
    let editWalletName = "";
    let editWalletEntityId = 1;
    let showImportCSV = false;
    let importStep = "upload";
    let importFile = null;
    let importWalletId = 0;
    let importParserName = "";
    let importTransactions = [];
    let importErrors = [];
    let importWarnings = [];
    let importResult = null;
    let showFiatChangeConfirm = false;
    let pendingFiatCurrency = null;
    let showAddTransaction = false;
    let txType = "incoming";
    let txAmount = "";
    let txWalletId = 0;
    let txCategory = "Uncategorized";
    let txNote = "";
    let txDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let txFiatValue = "";
    let txCurrency = "BTC";
    let txFeeSats = "";
    let txFeeFiat = "";
    let showEditTransaction = false;
    let editTxType = "incoming";
    let editTxAmount = "";
    let editTxCategory = "Uncategorized";
    let editTxNote = "";
    let editTxDate = "";
    let editTxFiatValue = "";
    let editTxCurrency = "BTC";
    let editTxFeeSats = "";
    let editTxFeeFiat = "";
    let showDeleteTransaction = false;
    let txToDelete = null;
    let walletName = "";
    let walletXpub = "";
    let walletType = "zpub";
    let walletEntityId = 1;
    let newEntityName = "";
    let currencyFormat = "sats";
    let showResetConfirm = false;
    let theme = "dark";
    let fiatEnabled = true;
    let fiatCurrency = "EUR";
    let currentFiatPrice = null;
    let dayOpenPrice = null;
    let priceLoading = false;
    let priceLastUpdated = null;
    let showDuplicateTransaction = false;
    let costBasisMethod = "average";
    let entityOptions = [
      { value: null, label: "All accounts", type: "all" },
      ...entities.map((e) => ({ value: e.id, label: e.name, type: e.entity_type }))
    ];
    let categoryNames = categories.map((c) => c.name);
    let walletOptions = (() => {
      const filtered = selectedEntityId ? wallets.filter((w) => w.entity_id === selectedEntityId) : wallets;
      return [
        { value: null, label: "All wallets" },
        ...filtered.map((w) => ({ value: w.id, label: w.name }))
      ];
    })();
    let availableYears = (() => {
      const years = /* @__PURE__ */ new Set();
      for (const tx of transactions) {
        if (tx.timestamp) {
          years.add(new Date(tx.timestamp * 1e3).getFullYear());
        }
      }
      return Array.from(years).sort((a, b) => b - a);
    })();
    let filteredTransactions = (() => {
      return transactions.filter((tx) => {
        if (selectedWalletId !== null && tx.wallet_id !== selectedWalletId) return false;
        if (!tx.timestamp) return filterMonth === null;
        const date = new Date(tx.timestamp * 1e3);
        date.getFullYear();
        date.getMonth() + 1;
        return true;
      });
    })();
    (() => {
      const sorted = [...filteredTransactions];
      sorted.sort((a, b) => {
        let aVal;
        let bVal;
        {
          aVal = a.timestamp ?? 0;
          bVal = b.timestamp ?? 0;
        }
        if (aVal < bVal) return 1;
        if (aVal > bVal) return -1;
        return 0;
      });
      return sorted;
    })();
    const categoryColors = {
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
    let btcTransactions = filteredTransactions.filter((tx) => (tx.currency || "BTC") === "BTC");
    let categoryBreakdown = (() => {
      const breakdown = {};
      for (const tx of btcTransactions) {
        if (tx.amount_sats < 0 && !EXCLUDED_FROM_TOTALS.includes(tx.category || "")) {
          const cat = tx.category || "Uncategorized";
          breakdown[cat] = (breakdown[cat] || 0) + Math.abs(tx.amount_sats);
        }
      }
      return Object.entries(breakdown).map(([label, value]) => ({ label, value, color: categoryColors[label] || "#666" })).sort((a, b) => b.value - a.value);
    })();
    let monthlyBalance = (() => {
      const monthly = {};
      for (const tx of btcTransactions) {
        if (tx.timestamp) {
          const date = new Date(tx.timestamp * 1e3);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthly[key] = (monthly[key] || 0) + tx.amount_sats;
        }
      }
      const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
      return sorted.map(([key, value]) => {
        const [, month] = key.split("-");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec"
        ];
        return {
          label: monthNames[parseInt(month) - 1],
          value,
          color: value >= 0 ? "#4ade80" : "#f87171"
        };
      });
    })();
    const INCOME_CATEGORIES = [
      "Trading Gain",
      "Buy",
      "Income",
      "Mining",
      "Lending Interest (Income)"
    ];
    const EXPENSE_CATEGORIES = [
      "Trading Loss",
      "Sell",
      "Lending Interest (Cost)",
      "Liquidation",
      "Food",
      "Shopping",
      "Utilities"
    ];
    let totalIncome = btcTransactions.filter((tx) => {
      const cat = tx.category || "Uncategorized";
      if (INCOME_CATEGORIES.includes(cat) && tx.amount_sats > 0) return true;
      if (cat === "Gift" && tx.amount_sats > 0) return true;
      return false;
    }).reduce((sum, tx) => sum + tx.amount_sats, 0);
    let totalSpent = Math.abs(btcTransactions.filter((tx) => {
      const cat = tx.category || "Uncategorized";
      if (EXPENSE_CATEGORIES.includes(cat) && tx.amount_sats < 0) return true;
      if (cat === "Gift" && tx.amount_sats < 0) return true;
      return false;
    }).reduce((sum, tx) => sum + tx.amount_sats, 0));
    let totalFlow = totalIncome - totalSpent;
    btcTransactions.reduce((sum, tx) => sum + tx.amount_sats, 0);
    let totalFees = (() => {
      let btcFees = 0;
      let fiatFees = {};
      for (const tx of filteredTransactions) {
        if (tx.fee_sats && tx.fee_sats > 0) {
          btcFees += tx.fee_sats;
        }
        if (tx.fee_fiat && tx.fee_fiat > 0 && tx.fee_fiat_currency) {
          fiatFees[tx.fee_fiat_currency] = (fiatFees[tx.fee_fiat_currency] || 0) + tx.fee_fiat;
        }
      }
      return { btcFees, fiatFees };
    })();
    let fiatHoldings = (() => {
      const holdings = {};
      for (const tx of filteredTransactions) {
        const currency = tx.currency || "BTC";
        if (currency !== "BTC") {
          holdings[currency] = (holdings[currency] || 0) + tx.amount_sats;
        }
      }
      for (const currency in holdings) {
        holdings[currency] = holdings[currency] / 100;
      }
      return holdings;
    })();
    const ACQUISITION_CATEGORIES = [
      "Buy",
      "Income",
      "Mining",
      "Gift",
      "Trading Gain",
      "Lending Interest (Income)"
    ];
    const DISPOSAL_CATEGORIES = [
      "Sell",
      "Food",
      "Utilities",
      "Shopping",
      "Trading Loss",
      "Liquidation"
    ];
    const PNL_EXCLUDED_CATEGORIES = [
      "Transfer In",
      "Transfer Out",
      "Receive Loan",
      "Repay Loan",
      "Uncategorized"
    ];
    let pnlData = (() => {
      if (!currentFiatPrice) {
        return {
          unrealized: { fiat: 0, percent: 0 },
          realized: { fiat: 0, percent: 0 },
          total: { fiat: 0, percent: 0 },
          totalCostBasis: 0,
          totalProceeds: 0
        };
      }
      const sorted = [...btcTransactions].filter((tx) => tx.timestamp && tx.fiat_value !== null).sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      const acquisitions = [];
      const disposals = [];
      for (const tx of sorted) {
        const category = tx.category || "Uncategorized";
        if (PNL_EXCLUDED_CATEGORIES.includes(category)) continue;
        if (tx.amount_sats > 0 && ACQUISITION_CATEGORIES.includes(category)) {
          acquisitions.push({
            sats: tx.amount_sats,
            fiatValue: Math.abs(tx.fiat_value),
            timestamp: tx.timestamp
          });
        } else if (tx.amount_sats < 0 && DISPOSAL_CATEGORIES.includes(category)) {
          disposals.push({
            sats: Math.abs(tx.amount_sats),
            fiatValue: Math.abs(tx.fiat_value),
            timestamp: tx.timestamp
          });
        } else if (tx.amount_sats < 0 && category === "Gift") {
          disposals.push({
            sats: Math.abs(tx.amount_sats),
            fiatValue: Math.abs(tx.fiat_value),
            timestamp: tx.timestamp
          });
        } else if (tx.amount_sats > 0 && category === "Gift") {
          acquisitions.push({
            sats: tx.amount_sats,
            fiatValue: Math.abs(tx.fiat_value),
            timestamp: tx.timestamp
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
        const remainingSats2 = totalAcquiredSats - totalDisposedSats;
        const remainingCostBasis2 = remainingSats2 * avgCostPerSat;
        remainingLots = remainingSats2 > 0 ? [
          {
            sats: remainingSats2,
            fiatValue: remainingCostBasis2,
            timestamp: 0
          }
        ] : [];
      }
      const remainingSats = remainingLots.reduce((sum, lot) => sum + lot.sats, 0);
      const remainingCostBasis = remainingLots.reduce((sum, lot) => sum + lot.fiatValue, 0);
      const currentValue = remainingSats / 1e8 * currentFiatPrice;
      const unrealizedPnL = currentValue - remainingCostBasis;
      const unrealizedPercent = remainingCostBasis > 0 ? unrealizedPnL / remainingCostBasis * 100 : 0;
      const realizedPercent = totalCostBasisUsed > 0 ? realizedPnL / totalCostBasisUsed * 100 : 0;
      const totalPnL = unrealizedPnL + realizedPnL;
      const totalCostBasis = remainingCostBasis + totalCostBasisUsed;
      const totalPercent = totalCostBasis > 0 ? totalPnL / totalCostBasis * 100 : 0;
      return {
        unrealized: { fiat: unrealizedPnL, percent: unrealizedPercent },
        realized: { fiat: realizedPnL, percent: realizedPercent },
        total: { fiat: totalPnL, percent: totalPercent },
        totalCostBasis,
        totalProceeds
      };
    })();
    let walletHoldings = (() => {
      const walletColors = [
        "#f7931a",
        "#4ade80",
        "#38bdf8",
        "#a78bfa",
        "#f472b6",
        "#fb923c",
        "#fbbf24",
        "#60a5fa",
        "#34d399",
        "#f87171"
      ];
      return getFilteredWallets().map((w, i) => ({
        label: w.name,
        value: balances[w.id] ?? 0,
        color: walletColors[i % walletColors.length]
      })).filter((w) => w.value > 0).sort((a, b) => b.value - a.value);
    })();
    let balanceHistory = (() => {
      if (btcTransactions.length === 0) return [];
      const sorted = [...btcTransactions].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      const monthlyData = {};
      let cumulative = 0;
      for (const tx of sorted) {
        if (!tx.timestamp) continue;
        const date = new Date(tx.timestamp * 1e3);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        cumulative += tx.amount_sats;
        monthlyData[key] = cumulative;
      }
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      return Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([key, value]) => {
        const [year, month] = key.split("-");
        return {
          label: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
          value
        };
      });
    })();
    (() => {
      const types = ["personal", "family", "business"];
      const result = {};
      for (const type of types) {
        const typeEntities = entities.filter((e) => e.entity_type === type);
        const entitiesWithWallets = typeEntities.map((entity) => {
          const entityWallets = wallets.filter((w) => w.entity_id === entity.id).sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0));
          const totalBalance = entityWallets.reduce((sum, w) => sum + (balances[w.id] ?? 0), 0);
          return { entity, wallets: entityWallets, totalBalance };
        }).sort((a, b) => b.totalBalance - a.totalBalance);
        const typeTotalBalance = entitiesWithWallets.reduce((sum, e) => sum + e.totalBalance, 0);
        result[type] = {
          totalBalance: typeTotalBalance,
          entities: entitiesWithWallets
        };
      }
      return result;
    })();
    function showMessage(msg, type = "info") {
      message = msg;
      messageType = type;
      setTimeout(
        () => {
          message = "";
        },
        3e3
      );
    }
    function formatPnL(pnl) {
      const symbol = fiatCurrency === "EUR" ? "€" : "$";
      const sign = pnl.fiat >= 0 ? "+" : "";
      const fiatStr = sign + symbol + Math.abs(pnl.fiat).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const percentStr = sign + pnl.percent.toFixed(1) + "%";
      return `${fiatStr} (${percentStr})`;
    }
    function formatSats(sats, showPlus = false) {
      const sign = sats > 0 && showPlus ? "+" : sats < 0 ? "-" : "";
      const absValue = Math.abs(sats);
      if (currencyFormat === "btc") {
        return "₿ " + sign + (absValue / 1e8).toFixed(8);
      } else {
        return "丰 " + sign + absValue.toLocaleString();
      }
    }
    function formatDate(timestamp) {
      if (!timestamp) return "Pending";
      return new Date(timestamp * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    function getTotalBalance() {
      if (selectedWalletId !== null) {
        return balances[selectedWalletId] ?? 0;
      }
      const filteredWallets = selectedEntityId ? wallets.filter((w) => w.entity_id === selectedEntityId) : wallets;
      return filteredWallets.reduce((sum, w) => sum + (balances[w.id] ?? 0), 0);
    }
    function getFilteredWallets() {
      if (selectedWalletId !== null) {
        return wallets.filter((w) => w.id === selectedWalletId);
      }
      if (!selectedEntityId) return wallets;
      return wallets.filter((w) => w.entity_id === selectedEntityId);
    }
    function closeDuplicateModal() {
      showDuplicateTransaction = false;
      txAmount = "";
      txNote = "";
      txFiatValue = "";
      txCategory = "Uncategorized";
      txDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      txCurrency = "BTC";
      txFeeSats = "";
      txFeeFiat = "";
    }
    function formatBalanceFiat(sats) {
      if (!currentFiatPrice) return "";
      const btc = sats / 1e8;
      const fiat = btc * currentFiatPrice;
      const symbol = fiatCurrency === "EUR" ? "€" : "$";
      return symbol + fiat.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function getPriceChange() {
      if (!currentFiatPrice || !dayOpenPrice) return null;
      const value = currentFiatPrice - dayOpenPrice;
      const percent = value / dayOpenPrice * 100;
      return { value, percent };
    }
    function formatPriceChange() {
      const change = getPriceChange();
      if (!change) return "";
      const symbol = fiatCurrency === "EUR" ? "€" : "$";
      const sign = change.value >= 0 ? "+" : "";
      return `${sign}${symbol}${Math.abs(change.value).toFixed(0)} (${sign}${change.percent.toFixed(2)}%)`;
    }
    function formatImportDate(timestamp) {
      return new Date(timestamp * 1e3).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    async function loadEntities() {
      try {
        entities = await invoke("get_entities");
      } catch (e) {
        showMessage(`${e}`, "error");
      }
    }
    async function loadWallets() {
      try {
        wallets = await invoke("get_wallets");
        await loadBalances();
      } catch (e) {
        showMessage(`${e}`, "error");
      }
    }
    async function loadBalances() {
      try {
        balances = await invoke("get_wallet_balances");
      } catch (e) {
        console.error("Failed to load balances:", e);
      }
    }
    async function loadSettings() {
      try {
        const format = await invoke("get_setting", { key: "currency_format" });
        if (format) currencyFormat = format;
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    async function loadCategories() {
      try {
        categories = await invoke("get_categories");
      } catch (e) {
        console.error("Failed to load categories:", e);
        categories = [
          { id: 1, name: "Uncategorized", is_system: true },
          { id: 2, name: "Buy", is_system: true },
          { id: 3, name: "Sell", is_system: true },
          { id: 4, name: "Transfer In", is_system: true },
          { id: 5, name: "Transfer Out", is_system: true }
        ];
      }
    }
    async function confirmDeleteCategory() {
      if (!categoryToDelete) return;
      try {
        await invoke("delete_category", { id: categoryToDelete.id });
        showMessage("Category deleted", "success");
        showDeleteCategory = false;
        categoryToDelete = null;
        await loadCategories();
        await loadTransactions();
      } catch (e) {
        showMessage(`${e}`, "error");
      }
    }
    async function loadFiatSettings() {
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
    function cancelFiatCurrencyChange() {
      showFiatChangeConfirm = false;
      pendingFiatCurrency = null;
    }
    async function fetchCurrentPrice() {
      priceLoading = true;
      try {
        const price = await invoke("fetch_current_price", { currency: fiatCurrency.toLowerCase() });
        currentFiatPrice = price;
        priceLastUpdated = /* @__PURE__ */ new Date();
        await invoke("cache_price", { currency: fiatCurrency, price, date: "current" });
        await fetchDayOpenPrice();
        showMessage(`Price updated: ${fiatCurrency === "EUR" ? "€" : "$"}${price.toLocaleString()}`, "success");
      } catch (e) {
        showMessage(`Failed to fetch price: ${e}`, "error");
      }
      priceLoading = false;
    }
    async function fetchDayOpenPrice() {
      try {
        const today = /* @__PURE__ */ new Date();
        const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
        const cacheKey = `${fiatCurrency}-dayopen`;
        const cached = await invoke("get_cached_price", { currency: fiatCurrency, date: cacheKey });
        if (cached) {
          dayOpenPrice = cached;
          return;
        }
        const price = await invoke("fetch_historical_price", { currency: fiatCurrency.toLowerCase(), date: dateStr });
        dayOpenPrice = price;
        await invoke("cache_price", { currency: fiatCurrency, price, date: cacheKey });
      } catch (e) {
        console.error("Failed to fetch day open price:", e);
        dayOpenPrice = null;
      }
    }
    async function loadCachedCurrentPrice() {
      try {
        const cached = await invoke("get_cached_price", { currency: fiatCurrency, date: "current" });
        if (cached) {
          currentFiatPrice = cached;
        }
        const cacheKey = `${fiatCurrency}-dayopen`;
        const cachedDayOpen = await invoke("get_cached_price", { currency: fiatCurrency, date: cacheKey });
        if (cachedDayOpen) {
          dayOpenPrice = cachedDayOpen;
        }
      } catch (e) {
        console.error("Failed to load cached price:", e);
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
      try {
        transactions = await invoke("get_all_transactions", { entityId: selectedEntityId });
      } catch (e) {
        showMessage(`${e}`, "error");
      }
    }
    async function confirmDeleteEntity() {
      if (!entityToDelete) return;
      try {
        await invoke("delete_entity", { id: entityToDelete.id });
        showMessage("Deleted", "success");
        if (selectedEntityId === entityToDelete.id) selectedEntityId = null;
        showDeleteEntity = false;
        entityToDelete = null;
        await loadEntities();
        await loadWallets();
      } catch (e) {
        showMessage(`${e}`, "error");
      }
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
    function applyTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
    }
    async function checkEncryptionStatus() {
      checkingEncryption = true;
      try {
        const exists = await invoke("check_db_exists");
        if (!exists) {
          dbEncrypted = false;
          appLocked = false;
        } else {
          dbEncrypted = await invoke("check_db_encrypted");
          appLocked = dbEncrypted;
        }
      } catch (e) {
        console.error("Failed to check encryption status:", e);
        dbEncrypted = false;
        appLocked = false;
      }
      checkingEncryption = false;
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
    async function loadAutoLockSetting() {
      try {
        const setting = await invoke("get_setting", { key: "auto_lock" });
        if (setting) {
          autoLockTime = setting;
        }
      } catch (e) {
        console.error("Failed to load auto-lock setting:", e);
      }
    }
    function setupAutoLock() {
      if (autoLockInterval) {
        clearInterval(autoLockInterval);
        autoLockInterval = null;
      }
      if (autoLockTime === "never" || !dbEncrypted) return;
      const lockMs = parseInt(autoLockTime) * 60 * 1e3;
      autoLockInterval = setInterval(
        () => {
          if (Date.now() - lastActivityTime > lockMs && !appLocked) {
            appLocked = true;
            showMessage("App locked due to inactivity", "info");
          }
        },
        1e4
      );
    }
    function resetActivityTimer() {
      lastActivityTime = Date.now();
    }
    function setupActivityTracking() {
      const events = ["mousedown", "keydown", "scroll", "touchstart"];
      events.forEach((event) => {
        document.addEventListener(event, resetActivityTimer, { passive: true });
      });
    }
    async function resetAllData() {
      try {
        await invoke("reset_all_data");
        showMessage("All data has been reset", "success");
        showResetConfirm = false;
        await loadEntities();
        await loadWallets();
        await loadTransactions();
      } catch (e) {
        showMessage(`Reset failed: ${e}`, "error");
      }
    }
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
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="app svelte-1uha8ag">`);
      if (checkingEncryption) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="unlock-screen svelte-1uha8ag"><div class="unlock-container svelte-1uha8ag"><div class="unlock-logo svelte-1uha8ag"><span class="logo-sat svelte-1uha8ag">Sat</span><span class="logo-stone svelte-1uha8ag">Stone</span></div> <div class="loading-spinner svelte-1uha8ag"></div> <p class="unlock-loading svelte-1uha8ag">Loading...</p></div></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
        if (appLocked) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="unlock-screen svelte-1uha8ag"><div class="unlock-container svelte-1uha8ag"><div class="unlock-logo svelte-1uha8ag"><span class="logo-sat svelte-1uha8ag">Sat</span><span class="logo-stone svelte-1uha8ag">Stone</span></div> <h1 class="unlock-title svelte-1uha8ag">Welcome Back</h1> <p class="unlock-subtitle svelte-1uha8ag">Enter your passphrase to unlock</p> <div class="unlock-tabs svelte-1uha8ag"><button${attr_class("unlock-tab svelte-1uha8ag", void 0, { "active": unlockMode === "passphrase" })}>Passphrase</button> <button${attr_class("unlock-tab svelte-1uha8ag", void 0, { "active": unlockMode === "recovery" })}>Recovery Phrase</button></div> `);
          {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="unlock-form svelte-1uha8ag"><input type="password"${attr("value", unlockPassphrase)} placeholder="Enter passphrase..." class="unlock-input svelte-1uha8ag"/> <button class="btn primary unlock-btn svelte-1uha8ag">Unlock</button></div>`);
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> <p class="unlock-hint svelte-1uha8ag">`);
          {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`Forgot your passphrase? Use your <button class="link-btn svelte-1uha8ag">recovery phrase</button>`);
          }
          $$renderer3.push(`<!--]--></p></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<header class="svelte-1uha8ag"><div class="header-left svelte-1uha8ag"><div class="logo svelte-1uha8ag">`);
          Bitcoin($$renderer3, { size: 24, color: "#f7931a" });
          $$renderer3.push(`<!----> <span>SatStone | BitFinances</span></div></div> <div class="header-center svelte-1uha8ag">`);
          Dropdown($$renderer3, {
            options: entityOptions,
            placeholder: "All accounts",
            get value() {
              return selectedEntityId;
            },
            set value($$value) {
              selectedEntityId = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----> `);
          Dropdown($$renderer3, {
            options: walletOptions,
            placeholder: "All wallets",
            get value() {
              return selectedWalletId;
            },
            set value($$value) {
              selectedWalletId = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div> <div class="header-right svelte-1uha8ag"><div class="header-stat svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Total Balance</span> <span class="stat-main svelte-1uha8ag">${escape_html(formatSats(getTotalBalance()))}</span> `);
          if (fiatEnabled && currentFiatPrice) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<span class="stat-sub svelte-1uha8ag">${escape_html(formatBalanceFiat(getTotalBalance()))}</span>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (fiatEnabled) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="header-stat svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">BTC / ${escape_html(fiatCurrency)}</span> <span class="stat-main btc-price-value svelte-1uha8ag">`);
            if (currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`${escape_html(fiatCurrency === "EUR" ? "€" : "$")}${escape_html(currentFiatPrice.toLocaleString())}`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`—`);
            }
            $$renderer3.push(`<!--]--></span> <span class="stat-sub svelte-1uha8ag">`);
            if (getPriceChange()) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span${attr_class("svelte-1uha8ag", void 0, {
                "positive": getPriceChange()?.value ?? 0 >= 0,
                "negative": getPriceChange()?.value ?? 0 < 0
              })}>${escape_html(formatPriceChange())}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
              if (priceLastUpdated) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`${escape_html(priceLastUpdated.toLocaleTimeString())}`);
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push(`—`);
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></span></div>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> <button${attr_class("icon-btn refresh-price svelte-1uha8ag", void 0, { "spinning": priceLoading })}${attr("disabled", priceLoading, true)} title="Refresh price">`);
          Refresh($$renderer3, { size: 16 });
          $$renderer3.push(`<!----></button></div></header> <nav class="tabs svelte-1uha8ag"><button${attr_class("tab svelte-1uha8ag", void 0, { "active": activeTab === "dashboard" })}>Dashboard</button> <button${attr_class("tab svelte-1uha8ag", void 0, { "active": activeTab === "wallets" })}>Wallets</button> <button${attr_class("tab svelte-1uha8ag", void 0, { "active": activeTab === "transactions" })}>Transactions</button> <button${attr_class("tab svelte-1uha8ag", void 0, { "active": activeTab === "settings" })}>Settings</button></nav> `);
          if (message) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div${attr_class(`toast ${stringify(messageType)}`, "svelte-1uha8ag")}>${escape_html(message)}</div>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> <main class="svelte-1uha8ag">`);
          {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="page-header svelte-1uha8ag"><h1 class="svelte-1uha8ag">Dashboard</h1> <div class="filters svelte-1uha8ag">`);
            $$renderer3.select(
              { class: "filter-select", value: filterYear },
              ($$renderer4) => {
                $$renderer4.option({ value: null }, ($$renderer5) => {
                  $$renderer5.push(`Years`);
                });
                $$renderer4.push(`<!--[-->`);
                const each_array = ensure_array_like(availableYears);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let year = each_array[$$index];
                  $$renderer4.option({ value: year }, ($$renderer5) => {
                    $$renderer5.push(`${escape_html(year)}`);
                  });
                }
                $$renderer4.push(`<!--]-->`);
              },
              "svelte-1uha8ag"
            );
            $$renderer3.push(` `);
            $$renderer3.select(
              { class: "filter-select", value: filterMonth },
              ($$renderer4) => {
                $$renderer4.option({ value: null }, ($$renderer5) => {
                  $$renderer5.push(`Months`);
                });
                $$renderer4.push(`<!--[-->`);
                const each_array_1 = ensure_array_like(MONTHS);
                for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                  let month = each_array_1[$$index_1];
                  $$renderer4.option({ value: month.value }, ($$renderer5) => {
                    $$renderer5.push(`${escape_html(month.label)}`);
                  });
                }
                $$renderer4.push(`<!--]-->`);
              },
              "svelte-1uha8ag"
            );
            $$renderer3.push(` `);
            {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div></div> <div class="stats-grid svelte-1uha8ag"><div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">${escape_html("Total Balance")}</span> <span class="stat-value primary svelte-1uha8ag">${escape_html(formatSats(getTotalBalance()))}</span> `);
            if (Object.keys(fiatHoldings).length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="stat-sub-holdings svelte-1uha8ag"><!--[-->`);
              const each_array_2 = ensure_array_like(Object.entries(fiatHoldings));
              for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                let [curr, amount] = each_array_2[$$index_2];
                $$renderer3.push(`<span${attr_class("fiat-holding svelte-1uha8ag", void 0, { "positive": amount >= 0, "negative": amount < 0 })}>${escape_html(curr === "EUR" ? "€" : "$")}${escape_html(amount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</span>`);
              }
              $$renderer3.push(`<!--]--></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Total Income</span> <span class="stat-value positive svelte-1uha8ag">${escape_html(formatSats(totalIncome))}</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="stat-sub svelte-1uha8ag">${escape_html(formatBalanceFiat(totalIncome))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Total Spent</span> <span class="stat-value negative svelte-1uha8ag">${escape_html(formatSats(totalSpent))}</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="stat-sub svelte-1uha8ag">${escape_html(formatBalanceFiat(totalSpent))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Flow</span> <span${attr_class("stat-value svelte-1uha8ag", void 0, { "positive": totalFlow >= 0, "negative": totalFlow < 0 })}>${escape_html(formatSats(totalFlow, true))}</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="stat-sub svelte-1uha8ag">${escape_html(formatBalanceFiat(totalFlow))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div></div> <div class="stats-grid svelte-1uha8ag"><div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Realized P&amp;L</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span${attr_class("stat-value svelte-1uha8ag", void 0, {
                "positive": pnlData.realized.fiat >= 0,
                "negative": pnlData.realized.fiat < 0
              })}>${escape_html(formatPnL(pnlData.realized))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<span class="stat-value muted svelte-1uha8ag">Enable fiat</span>`);
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Unrealized P&amp;L</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span${attr_class("stat-value svelte-1uha8ag", void 0, {
                "positive": pnlData.unrealized.fiat >= 0,
                "negative": pnlData.unrealized.fiat < 0
              })}>${escape_html(formatPnL(pnlData.unrealized))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<span class="stat-value muted svelte-1uha8ag">Enable fiat</span>`);
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Fees Paid</span> <span class="stat-value negative svelte-1uha8ag">`);
            if (totalFees.btcFees > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`${escape_html(formatSats(totalFees.btcFees))}`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`—`);
            }
            $$renderer3.push(`<!--]--></span> `);
            if (Object.keys(totalFees.fiatFees).length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="stat-sub-holdings svelte-1uha8ag"><!--[-->`);
              const each_array_3 = ensure_array_like(Object.entries(totalFees.fiatFees));
              for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                let [curr, amount] = each_array_3[$$index_3];
                $$renderer3.push(`<span class="fiat-holding negative svelte-1uha8ag">${escape_html(curr === "EUR" ? "€" : "$")}${escape_html(amount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</span>`);
              }
              $$renderer3.push(`<!--]--></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="stat-card svelte-1uha8ag"><span class="stat-label svelte-1uha8ag">Total P&amp;L</span> `);
            if (fiatEnabled && currentFiatPrice) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span${attr_class("stat-value svelte-1uha8ag", void 0, {
                "positive": pnlData.total.fiat >= 0,
                "negative": pnlData.total.fiat < 0
              })}>${escape_html(formatPnL(pnlData.total))}</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<span class="stat-value muted svelte-1uha8ag">Enable fiat</span>`);
            }
            $$renderer3.push(`<!--]--></div></div> <div class="charts-grid svelte-1uha8ag"><div class="chart-card svelte-1uha8ag"><h2 class="svelte-1uha8ag">Monthly Flow</h2> `);
            if (monthlyBalance.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="chart-empty svelte-1uha8ag">No transaction data yet</div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              BarChart($$renderer3, { data: monthlyBalance, height: 200 });
            }
            $$renderer3.push(`<!--]--></div> <div class="chart-card svelte-1uha8ag"><h2 class="svelte-1uha8ag">Spending by Category</h2> `);
            if (categoryBreakdown.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="chart-empty svelte-1uha8ag">No spending data yet</div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              PieChart($$renderer3, { data: categoryBreakdown, size: 160 });
            }
            $$renderer3.push(`<!--]--></div></div> <div class="charts-grid svelte-1uha8ag"><div class="chart-card svelte-1uha8ag"><h2 class="svelte-1uha8ag">Balance History</h2> `);
            if (balanceHistory.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="chart-empty svelte-1uha8ag">No transaction data yet</div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              LineChart($$renderer3, { data: balanceHistory, height: 200 });
            }
            $$renderer3.push(`<!--]--></div> <div class="chart-card svelte-1uha8ag"><h2 class="svelte-1uha8ag">Holdings by Wallet</h2> `);
            if (walletHoldings.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="chart-empty svelte-1uha8ag">No wallet data yet</div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              PieChart($$renderer3, { data: walletHoldings, size: 160 });
            }
            $$renderer3.push(`<!--]--></div></div> <div class="chart-card full-width svelte-1uha8ag"><h2 class="svelte-1uha8ag">Recent Activity</h2> `);
            if (filteredTransactions.length === 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div class="chart-empty svelte-1uha8ag">No transactions yet</div>`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<div class="recent-list svelte-1uha8ag"><!--[-->`);
              const each_array_4 = ensure_array_like(filteredTransactions.slice(0, 5));
              for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
                let tx = each_array_4[$$index_4];
                $$renderer3.push(`<div class="recent-item svelte-1uha8ag"><div class="recent-info svelte-1uha8ag"><span class="recent-category svelte-1uha8ag">${escape_html(tx.category || "Uncategorized")}</span> <span class="recent-date svelte-1uha8ag">${escape_html(formatDate(tx.timestamp))}</span></div> <span${attr_class("recent-amount svelte-1uha8ag", void 0, {
                  "positive": tx.amount_sats >= 0,
                  "negative": tx.amount_sats < 0
                })}>${escape_html(formatSats(tx.amount_sats, true))}</span></div>`);
              }
              $$renderer3.push(`<!--]--></div>`);
            }
            $$renderer3.push(`<!--]--></div>`);
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--></main>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div> `);
      Modal($$renderer3, {
        title: "Add Wallet",
        open: showAddWallet,
        onclose: () => showAddWallet = false,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="wallet-name" class="svelte-1uha8ag">Name</label> <input id="wallet-name"${attr("value", walletName)} placeholder="My Bitcoin Wallet" class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label class="svelte-1uha8ag">Wallet Type</label> <div class="wallet-type-toggle svelte-1uha8ag"><button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": !walletIsManual })}>Watch-only (xpub)</button> <button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": walletIsManual })}>Manual</button></div></div> `);
          {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="wallet-xpub" class="svelte-1uha8ag">Extended Public Key</label> <input id="wallet-xpub"${attr("value", walletXpub)} placeholder="xpub / ypub / zpub" class="svelte-1uha8ag"/></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="wallet-type" class="svelte-1uha8ag">Address Type</label> `);
            $$renderer4.select(
              { id: "wallet-type", value: walletType, class: "" },
              ($$renderer5) => {
                $$renderer5.option({ value: "zpub" }, ($$renderer6) => {
                  $$renderer6.push(`zpub (Native SegWit)`);
                });
                $$renderer5.option({ value: "ypub" }, ($$renderer6) => {
                  $$renderer6.push(`ypub (SegWit)`);
                });
                $$renderer5.option({ value: "xpub" }, ($$renderer6) => {
                  $$renderer6.push(`xpub (Legacy)`);
                });
              },
              "svelte-1uha8ag"
            );
            $$renderer4.push(`</div> <div class="form-group svelte-1uha8ag"><label for="wallet-owner" class="svelte-1uha8ag">Owner</label> `);
            $$renderer4.select(
              { id: "wallet-owner", value: walletEntityId, class: "" },
              ($$renderer5) => {
                $$renderer5.push(`<!--[-->`);
                const each_array_19 = ensure_array_like(entities);
                for (let $$index_19 = 0, $$length = each_array_19.length; $$index_19 < $$length; $$index_19++) {
                  let entity = each_array_19[$$index_19];
                  $$renderer5.option({ value: entity.id }, ($$renderer6) => {
                    $$renderer6.push(`${escape_html(entity.name)}`);
                  });
                }
                $$renderer5.push(`<!--]-->`);
              },
              "svelte-1uha8ag"
            );
            $$renderer4.push(`</div></div>`);
          }
          $$renderer4.push(`<!--]--> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Add Wallet</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Add Family Member",
        open: showAddEntity,
        onclose: () => showAddEntity = false,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="entity-name" class="svelte-1uha8ag">Name</label> <input id="entity-name"${attr("value", newEntityName)}${attr("placeholder", "e.g. Partner")} class="svelte-1uha8ag"/></div> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Add</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      ConfirmDelete($$renderer3, {
        open: showDeleteWallet,
        name: ""
      });
      $$renderer3.push(`<!----> `);
      ConfirmDialog($$renderer3, {
        open: showDeleteEntity,
        title: "Delete",
        message: `Delete "${entityToDelete?.name}"? Associated wallets will also be deleted.`,
        confirmText: "Delete",
        danger: true,
        onconfirm: confirmDeleteEntity,
        onclose: () => {
          showDeleteEntity = false;
          entityToDelete = null;
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Edit Wallet",
        open: showEditWallet,
        onclose: () => {
          showEditWallet = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="edit-wallet-name" class="svelte-1uha8ag">Name</label> <input id="edit-wallet-name"${attr("value", editWalletName)} placeholder="Wallet name" class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="edit-wallet-owner" class="svelte-1uha8ag">Owner</label> `);
          $$renderer4.select(
            {
              id: "edit-wallet-owner",
              value: editWalletEntityId,
              class: ""
            },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_22 = ensure_array_like(entities);
              for (let $$index_22 = 0, $$length = each_array_22.length; $$index_22 < $$length; $$index_22++) {
                let entity = each_array_22[$$index_22];
                $$renderer5.option({ value: entity.id }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(entity.name)}`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Save</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Add Transaction",
        open: showAddTransaction,
        onclose: () => showAddTransaction = false,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="tx-type-toggle svelte-1uha8ag"><button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": txType === "incoming" })}>Incoming</button> <button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": txType === "outgoing" })}>Outgoing</button></div> <div class="form-group svelte-1uha8ag"><label class="svelte-1uha8ag">Currency</label> <div class="currency-toggle svelte-1uha8ag"><button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "BTC" })}>BTC</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "EUR" })}>EUR</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "USD" })}>USD</button></div></div> <div class="form-group svelte-1uha8ag"><label for="tx-amount" class="svelte-1uha8ag">Amount `);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`(sats or BTC)`);
          } else {
            $$renderer4.push("<!--[!-->");
            $$renderer4.push(`(${escape_html(txCurrency)})`);
          }
          $$renderer4.push(`<!--]--></label> <input id="tx-amount" type="text"${attr("value", txAmount)}${attr("placeholder", txCurrency === "BTC" ? "e.g. 100000 or 0.001" : "e.g. 100.00")} class="svelte-1uha8ag"/> `);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<span class="form-hint svelte-1uha8ag">Enter sats (whole number) or BTC (with decimal)</span>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="tx-wallet" class="svelte-1uha8ag">Wallet</label> `);
          $$renderer4.select(
            { id: "tx-wallet", value: txWalletId, class: "" },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_23 = ensure_array_like(wallets);
              for (let $$index_23 = 0, $$length = each_array_23.length; $$index_23 < $$length; $$index_23++) {
                let wallet = each_array_23[$$index_23];
                $$renderer5.option({ value: wallet.id }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(wallet.name)}`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div> <div class="form-group svelte-1uha8ag"><label for="tx-date" class="svelte-1uha8ag">Date</label> <input id="tx-date" type="date"${attr("value", txDate)} class="svelte-1uha8ag"/></div></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="tx-category" class="svelte-1uha8ag">Category</label> `);
          $$renderer4.select(
            { id: "tx-category", value: txCategory, class: "" },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_24 = ensure_array_like(categoryNames);
              for (let $$index_24 = 0, $$length = each_array_24.length; $$index_24 < $$length; $$index_24++) {
                let cat = each_array_24[$$index_24];
                $$renderer5.option({ value: cat }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(cat)}`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div> `);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="tx-fiat" class="svelte-1uha8ag">Fiat Value (${escape_html(fiatCurrency)}, optional)</label> <input id="tx-fiat" type="text"${attr("value", txFiatValue)} placeholder="e.g. 85.50" class="svelte-1uha8ag"/></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="tx-fee-sats" class="svelte-1uha8ag">Fee (sats, optional)</label> <input id="tx-fee-sats" type="text"${attr("value", txFeeSats)} placeholder="e.g. 150" class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="tx-fee-fiat" class="svelte-1uha8ag">Fee (${escape_html(fiatCurrency)}, optional)</label> <input id="tx-fee-fiat" type="text"${attr("value", txFeeFiat)} placeholder="e.g. 0.50" class="svelte-1uha8ag"/></div></div> <div class="form-group svelte-1uha8ag"><label for="tx-note" class="svelte-1uha8ag">Note (optional)</label> <input id="tx-note" type="text"${attr("value", txNote)} placeholder="Description..." class="svelte-1uha8ag"/></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Add ${escape_html("Incoming")} Transaction</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Add Category",
        open: showAddCategory,
        onclose: () => {
          showAddCategory = false;
          newCategoryName = "";
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="new-category-name" class="svelte-1uha8ag">Category Name</label> <input id="new-category-name" type="text"${attr("value", newCategoryName)} placeholder="e.g. Subscriptions, Donations..." class="svelte-1uha8ag"/></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Add Category</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Edit Category",
        open: showEditCategory,
        onclose: () => {
          showEditCategory = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="edit-category-name" class="svelte-1uha8ag">Category Name</label> <input id="edit-category-name" type="text"${attr("value", editCategoryName)} placeholder="Category name" class="svelte-1uha8ag"/></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Save</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      ConfirmDialog($$renderer3, {
        open: showDeleteCategory,
        title: "Delete Category",
        message: `Delete "${categoryToDelete?.name}"? All transactions with this category will be set to "Uncategorized".`,
        confirmText: "Delete",
        danger: true,
        onconfirm: confirmDeleteCategory,
        onclose: () => {
          showDeleteCategory = false;
          categoryToDelete = null;
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Edit Transaction",
        open: showEditTransaction,
        onclose: () => {
          showEditTransaction = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="tx-type-toggle svelte-1uha8ag"><button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": editTxType === "incoming" })}>Incoming</button> <button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": editTxType === "outgoing" })}>Outgoing</button></div> <div class="form-group svelte-1uha8ag"><label class="svelte-1uha8ag">Currency</label> <div class="currency-toggle svelte-1uha8ag"><button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": editTxCurrency === "BTC" })}>BTC</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": editTxCurrency === "EUR" })}>EUR</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": editTxCurrency === "USD" })}>USD</button></div></div> <div class="form-group svelte-1uha8ag"><label for="edit-tx-amount" class="svelte-1uha8ag">Amount `);
          {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`(sats or BTC)`);
          }
          $$renderer4.push(`<!--]--></label> <input id="edit-tx-amount" type="text"${attr("value", editTxAmount)}${attr("placeholder", "e.g. 100000 or 0.001")} class="svelte-1uha8ag"/> `);
          {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<span class="form-hint svelte-1uha8ag">Enter sats (whole number) or BTC (with decimal)</span>`);
          }
          $$renderer4.push(`<!--]--></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="edit-tx-date" class="svelte-1uha8ag">Date</label> <input id="edit-tx-date" type="date"${attr("value", editTxDate)} class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="edit-tx-category" class="svelte-1uha8ag">Category</label> `);
          $$renderer4.select(
            { id: "edit-tx-category", value: editTxCategory, class: "" },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_25 = ensure_array_like(categoryNames);
              for (let $$index_25 = 0, $$length = each_array_25.length; $$index_25 < $$length; $$index_25++) {
                let cat = each_array_25[$$index_25];
                $$renderer5.option({ value: cat }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(cat)}`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div></div> <div class="form-row-modal svelte-1uha8ag">`);
          {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="edit-tx-fiat" class="svelte-1uha8ag">Fiat Value (${escape_html(fiatCurrency)}, optional)</label> <input id="edit-tx-fiat" type="text"${attr("value", editTxFiatValue)} placeholder="e.g. 85.50" class="svelte-1uha8ag"/></div>`);
          }
          $$renderer4.push(`<!--]--> <div class="form-group svelte-1uha8ag"><label for="edit-tx-note" class="svelte-1uha8ag">Note (optional)</label> <input id="edit-tx-note" type="text"${attr("value", editTxNote)} placeholder="Description..." class="svelte-1uha8ag"/></div></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="edit-tx-fee-sats" class="svelte-1uha8ag">Fee (sats, optional)</label> <input id="edit-tx-fee-sats" type="text"${attr("value", editTxFeeSats)} placeholder="e.g. 150" class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="edit-tx-fee-fiat" class="svelte-1uha8ag">Fee (${escape_html(fiatCurrency)}, optional)</label> <input id="edit-tx-fee-fiat" type="text"${attr("value", editTxFeeFiat)} placeholder="e.g. 0.50" class="svelte-1uha8ag"/></div></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Save Changes</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Duplicate Transaction",
        open: showDuplicateTransaction,
        onclose: closeDuplicateModal,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="duplicate-info svelte-1uha8ag"><p class="svelte-1uha8ag">Creating a copy of this transaction. Edit the values as needed.</p></div> <div class="tx-type-toggle svelte-1uha8ag"><button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": txType === "incoming" })}>Incoming</button> <button${attr_class("type-btn svelte-1uha8ag", void 0, { "active": txType === "outgoing" })}>Outgoing</button></div> <div class="form-group svelte-1uha8ag"><label class="svelte-1uha8ag">Currency</label> <div class="currency-toggle svelte-1uha8ag"><button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "BTC" })}>BTC</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "EUR" })}>EUR</button> <button${attr_class("type-btn small svelte-1uha8ag", void 0, { "active": txCurrency === "USD" })}>USD</button></div></div> <div class="form-group svelte-1uha8ag"><label for="dup-tx-wallet" class="svelte-1uha8ag">Wallet</label> `);
          $$renderer4.select(
            { id: "dup-tx-wallet", value: txWalletId, class: "" },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_26 = ensure_array_like(wallets);
              for (let $$index_26 = 0, $$length = each_array_26.length; $$index_26 < $$length; $$index_26++) {
                let wallet = each_array_26[$$index_26];
                $$renderer5.option({ value: wallet.id }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(wallet.name)} (${escape_html(wallet.owner_name)})`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div> <div class="form-group svelte-1uha8ag"><label for="dup-tx-amount" class="svelte-1uha8ag">Amount `);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`(sats or BTC)`);
          } else {
            $$renderer4.push("<!--[!-->");
            $$renderer4.push(`(${escape_html(txCurrency)})`);
          }
          $$renderer4.push(`<!--]--></label> <input id="dup-tx-amount" type="text"${attr("value", txAmount)}${attr("placeholder", txCurrency === "BTC" ? "e.g. 100000 or 0.001" : "e.g. 100.00")} class="svelte-1uha8ag"/> `);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<span class="form-hint svelte-1uha8ag">Enter sats (whole number) or BTC (with decimal)</span>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="dup-tx-date" class="svelte-1uha8ag">Date</label> <input id="dup-tx-date" type="date"${attr("value", txDate)} class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="dup-tx-category" class="svelte-1uha8ag">Category</label> `);
          $$renderer4.select(
            { id: "dup-tx-category", value: txCategory, class: "" },
            ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array_27 = ensure_array_like(categoryNames);
              for (let $$index_27 = 0, $$length = each_array_27.length; $$index_27 < $$length; $$index_27++) {
                let cat = each_array_27[$$index_27];
                $$renderer5.option({ value: cat }, ($$renderer6) => {
                  $$renderer6.push(`${escape_html(cat)}`);
                });
              }
              $$renderer5.push(`<!--]-->`);
            },
            "svelte-1uha8ag"
          );
          $$renderer4.push(`</div></div> <div class="form-row-modal svelte-1uha8ag">`);
          if (txCurrency === "BTC") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="dup-tx-fiat" class="svelte-1uha8ag">Fiat Value (${escape_html(fiatCurrency)}, optional)</label> <input id="dup-tx-fiat" type="text"${attr("value", txFiatValue)} placeholder="e.g. 85.50" class="svelte-1uha8ag"/></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> <div class="form-group svelte-1uha8ag"><label for="dup-tx-note" class="svelte-1uha8ag">Note (optional)</label> <input id="dup-tx-note" type="text"${attr("value", txNote)} placeholder="Description..." class="svelte-1uha8ag"/></div></div> <div class="form-row-modal svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="dup-tx-fee-sats" class="svelte-1uha8ag">Fee (sats, optional)</label> <input id="dup-tx-fee-sats" type="text"${attr("value", txFeeSats)} placeholder="e.g. 150" class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="dup-tx-fee-fiat" class="svelte-1uha8ag">Fee (${escape_html(fiatCurrency)}, optional)</label> <input id="dup-tx-fee-fiat" type="text"${attr("value", txFeeFiat)} placeholder="e.g. 0.50" class="svelte-1uha8ag"/></div></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag">Create Duplicate</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      ConfirmDialog($$renderer3, {
        open: showDeleteTransaction,
        title: "Delete Transaction",
        message: `Delete this ${txToDelete?.amount_sats ? formatSats(txToDelete.amount_sats) : ""} transaction? This cannot be undone.`,
        confirmText: "Delete",
        danger: true,
        onconfirm: confirmDeleteTransaction,
        onclose: () => {
          showDeleteTransaction = false;
          txToDelete = null;
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Change Fiat Currency",
        open: showFiatChangeConfirm,
        onclose: cancelFiatCurrencyChange,
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="confirm-content svelte-1uha8ag"><p class="confirm-message svelte-1uha8ag">You're changing from <strong>${escape_html(fiatCurrency)}</strong> to <strong>${escape_html(pendingFiatCurrency)}</strong>.</p> <p class="confirm-detail svelte-1uha8ag">You have <strong>${escape_html(transactions.filter((tx) => tx.fiat_value !== null).length)}</strong> transactions with historical fiat values.</p> <p class="confirm-question svelte-1uha8ag">Would you like to update all historical transaction values to ${escape_html(pendingFiatCurrency)}?</p> <p class="confirm-warning svelte-1uha8ag">This will fetch new prices from Coingecko and may take a few minutes depending on the number of unique dates.</p></div> <div class="form-actions three-buttons svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn secondary svelte-1uha8ag">Keep Old Values</button> <button class="btn primary svelte-1uha8ag">Update All</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Import CSV",
        open: showImportCSV,
        onclose: closeImport,
        children: ($$renderer4) => {
          if (importStep === "upload") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="import-upload svelte-1uha8ag"><div class="form-group svelte-1uha8ag"><label for="import-wallet" class="svelte-1uha8ag">Import to Wallet</label> `);
            $$renderer4.select(
              { id: "import-wallet", value: importWalletId, class: "" },
              ($$renderer5) => {
                $$renderer5.push(`<!--[-->`);
                const each_array_28 = ensure_array_like(wallets);
                for (let $$index_28 = 0, $$length = each_array_28.length; $$index_28 < $$length; $$index_28++) {
                  let wallet = each_array_28[$$index_28];
                  $$renderer5.option({ value: wallet.id }, ($$renderer6) => {
                    $$renderer6.push(`${escape_html(wallet.name)}`);
                  });
                }
                $$renderer5.push(`<!--]-->`);
              },
              "svelte-1uha8ag"
            );
            $$renderer4.push(`</div> <div class="file-upload svelte-1uha8ag"><label class="file-upload-label svelte-1uha8ag"><input type="file" accept=".csv" class="svelte-1uha8ag"/> <span class="file-upload-btn svelte-1uha8ag">Choose CSV File</span> <span class="file-upload-hint svelte-1uha8ag">Supported: Phoenix, Bitstack, Bull Bitcoin, LN Markets</span></label></div> `);
            if (importErrors.length > 0) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<div class="import-errors svelte-1uha8ag"><!--[-->`);
              const each_array_29 = ensure_array_like(importErrors);
              for (let $$index_29 = 0, $$length = each_array_29.length; $$index_29 < $$length; $$index_29++) {
                let error = each_array_29[$$index_29];
                $$renderer4.push(`<p class="error-text svelte-1uha8ag">${escape_html(error)}</p>`);
              }
              $$renderer4.push(`<!--]--></div>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
            if (importStep === "preview") {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<div class="import-preview"><div class="import-summary svelte-1uha8ag"><p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Source:</strong> ${escape_html(importParserName)}</p> <p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">File:</strong> ${escape_html(importFile?.name)}</p> <p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Transactions:</strong> ${escape_html(importTransactions.length)}</p> <p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Target Wallet:</strong> ${escape_html(wallets.find((w) => w.id === importWalletId)?.name)}</p></div> `);
              if (importWarnings.length > 0) {
                $$renderer4.push("<!--[-->");
                $$renderer4.push(`<div class="import-warnings svelte-1uha8ag"><p class="warning-title svelte-1uha8ag">Warnings:</p> <!--[-->`);
                const each_array_30 = ensure_array_like(importWarnings.slice(0, 5));
                for (let $$index_30 = 0, $$length = each_array_30.length; $$index_30 < $$length; $$index_30++) {
                  let warning = each_array_30[$$index_30];
                  $$renderer4.push(`<p class="warning-text svelte-1uha8ag">${escape_html(warning)}</p>`);
                }
                $$renderer4.push(`<!--]--> `);
                if (importWarnings.length > 5) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<p class="warning-text svelte-1uha8ag">...and ${escape_html(importWarnings.length - 5)} more</p>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--></div>`);
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]--> `);
              if (importErrors.length > 0) {
                $$renderer4.push("<!--[-->");
                $$renderer4.push(`<div class="import-errors svelte-1uha8ag"><p class="error-title svelte-1uha8ag">Errors:</p> <!--[-->`);
                const each_array_31 = ensure_array_like(importErrors.slice(0, 5));
                for (let $$index_31 = 0, $$length = each_array_31.length; $$index_31 < $$length; $$index_31++) {
                  let error = each_array_31[$$index_31];
                  $$renderer4.push(`<p class="error-text svelte-1uha8ag">${escape_html(error)}</p>`);
                }
                $$renderer4.push(`<!--]--> `);
                if (importErrors.length > 5) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<p class="error-text svelte-1uha8ag">...and ${escape_html(importErrors.length - 5)} more</p>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--></div>`);
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]--> <div class="import-table svelte-1uha8ag"><div class="import-table-header svelte-1uha8ag"><span>Date</span> <span>Amount</span> <span>Category</span> <span>Note</span></div> <div class="import-table-body svelte-1uha8ag"><!--[-->`);
              const each_array_32 = ensure_array_like(importTransactions.slice(0, 10));
              for (let $$index_32 = 0, $$length = each_array_32.length; $$index_32 < $$length; $$index_32++) {
                let tx = each_array_32[$$index_32];
                $$renderer4.push(`<div class="import-table-row svelte-1uha8ag"><span>${escape_html(formatImportDate(tx.timestamp))}</span> <span${attr_class("svelte-1uha8ag", void 0, {
                  "positive": tx.amount_sats >= 0,
                  "negative": tx.amount_sats < 0
                })}>${escape_html(formatSats(tx.amount_sats, true))}</span> <span>${escape_html(tx.category)}</span> <span class="truncate svelte-1uha8ag">${escape_html(tx.note || "—")}</span></div>`);
              }
              $$renderer4.push(`<!--]--> `);
              if (importTransactions.length > 10) {
                $$renderer4.push("<!--[-->");
                $$renderer4.push(`<div class="import-table-more svelte-1uha8ag">...and ${escape_html(importTransactions.length - 10)} more transactions</div>`);
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]--></div></div></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Back</button> <button class="btn primary svelte-1uha8ag"${attr("disabled", importTransactions.length === 0, true)}>Import ${escape_html(importTransactions.length)} Transactions</button></div>`);
            } else {
              $$renderer4.push("<!--[!-->");
              if (importStep === "importing") {
                $$renderer4.push("<!--[-->");
                $$renderer4.push(`<div class="import-progress svelte-1uha8ag"><div class="spinner large svelte-1uha8ag"></div> <p class="svelte-1uha8ag">Importing transactions...</p></div>`);
              } else {
                $$renderer4.push("<!--[!-->");
                if (importStep === "done") {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<div class="import-done svelte-1uha8ag"><div class="import-result svelte-1uha8ag"><p class="result-success svelte-1uha8ag">✓ Imported: ${escape_html(importResult?.imported)}</p> <p class="result-skipped svelte-1uha8ag">⊘ Skipped (duplicates): ${escape_html(importResult?.skipped)}</p> `);
                  if (importResult?.errors && importResult.errors.length > 0) {
                    $$renderer4.push("<!--[-->");
                    $$renderer4.push(`<p class="result-errors svelte-1uha8ag">✕ Errors: ${escape_html(importResult.errors.length)}</p>`);
                  } else {
                    $$renderer4.push("<!--[!-->");
                  }
                  $$renderer4.push(`<!--]--></div> `);
                  if (importResult?.errors && importResult.errors.length > 0) {
                    $$renderer4.push("<!--[-->");
                    $$renderer4.push(`<div class="import-errors svelte-1uha8ag"><!--[-->`);
                    const each_array_33 = ensure_array_like(importResult.errors.slice(0, 5));
                    for (let $$index_33 = 0, $$length = each_array_33.length; $$index_33 < $$length; $$index_33++) {
                      let error = each_array_33[$$index_33];
                      $$renderer4.push(`<p class="error-text svelte-1uha8ag">${escape_html(error)}</p>`);
                    }
                    $$renderer4.push(`<!--]--></div>`);
                  } else {
                    $$renderer4.push("<!--[!-->");
                  }
                  $$renderer4.push(`<!--]--></div> <div class="form-actions svelte-1uha8ag"><button class="btn primary svelte-1uha8ag">Done</button></div>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]-->`);
              }
              $$renderer4.push(`<!--]-->`);
            }
            $$renderer4.push(`<!--]-->`);
          }
          $$renderer4.push(`<!--]-->`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Enable Database Encryption",
        open: showEncryptionSetup,
        onclose: cancelEncryptionSetup,
        children: ($$renderer4) => {
          if (encryptionStep === "passphrase") {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="encryption-warning svelte-1uha8ag"><span class="warning-icon svelte-1uha8ag">⚠️</span> <p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Important:</strong> If you lose your passphrase AND recovery phrase, your data will be permanently lost. There is no way to recover it.</p></div> <div class="form-group svelte-1uha8ag"><label for="encrypt-pass" class="svelte-1uha8ag">Create Passphrase</label> <input id="encrypt-pass" type="password"${attr("value", encryptPassphrase)} placeholder="Enter a strong passphrase..." class="svelte-1uha8ag"/> `);
            if (passwordStrength) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<div class="password-strength svelte-1uha8ag"><div class="strength-bar svelte-1uha8ag"><div${attr_class("strength-fill svelte-1uha8ag", void 0, {
                "very-weak": passwordStrength.level === "very_weak",
                "weak": passwordStrength.level === "weak",
                "fair": passwordStrength.level === "fair",
                "strong": passwordStrength.level === "strong",
                "very-strong": passwordStrength.level === "very_strong"
              })}${attr_style(`width: ${stringify(passwordStrength.score)}%`)}></div></div> <span${attr_class("strength-label svelte-1uha8ag", void 0, {
                "very-weak": passwordStrength.level === "very_weak",
                "weak": passwordStrength.level === "weak",
                "fair": passwordStrength.level === "fair",
                "strong": passwordStrength.level === "strong",
                "very-strong": passwordStrength.level === "very_strong"
              })}>${escape_html(passwordStrength.label)}</span></div>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--></div> <div class="form-group svelte-1uha8ag"><label for="encrypt-pass-confirm" class="svelte-1uha8ag">Confirm Passphrase</label> <input id="encrypt-pass-confirm" type="password"${attr("value", encryptPassphraseConfirm)} placeholder="Confirm your passphrase..." class="svelte-1uha8ag"/> `);
            if (encryptPassphraseConfirm && encryptPassphrase !== encryptPassphraseConfirm) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<span class="form-error svelte-1uha8ag">Passphrases do not match</span>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag"${attr("disabled", !encryptPassphrase || encryptPassphrase !== encryptPassphraseConfirm, true)}>Continue</button></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
            if (encryptionStep === "recovery") {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<div class="recovery-section svelte-1uha8ag"><div class="recovery-warning svelte-1uha8ag"><span class="warning-icon svelte-1uha8ag">📝</span> <p class="svelte-1uha8ag"><strong>Write this down!</strong> This 12-word phrase is the ONLY way to recover your data if you forget your passphrase.</p></div> <div class="recovery-phrase-display svelte-1uha8ag"><div class="recovery-words svelte-1uha8ag"><!--[-->`);
              const each_array_34 = ensure_array_like(encryptRecoveryPhrase.split(" "));
              for (let i = 0, $$length = each_array_34.length; i < $$length; i++) {
                let word = each_array_34[i];
                $$renderer4.push(`<div class="recovery-word svelte-1uha8ag"><span class="word-number svelte-1uha8ag">${escape_html(i + 1)}.</span> <span class="word-text svelte-1uha8ag">${escape_html(word)}</span></div>`);
              }
              $$renderer4.push(`<!--]--></div> <button class="btn secondary copy-btn svelte-1uha8ag">📋 Copy to Clipboard</button></div> <div class="recovery-confirm svelte-1uha8ag"><label class="checkbox-label svelte-1uha8ag"><input type="checkbox"${attr("checked", recoveryPhraseConfirmed, true)} class="svelte-1uha8ag"/> <span class="svelte-1uha8ag">I have written down my recovery phrase and stored it safely</span></label></div></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Back</button> <button class="btn primary svelte-1uha8ag"${attr("disabled", !recoveryPhraseConfirmed, true)}>Enable Encryption</button></div>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]-->`);
          }
          $$renderer4.push(`<!--]-->`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Change Passphrase",
        open: showChangePassphrase,
        onclose: () => {
          showChangePassphrase = false;
          currentPassphrase = "";
          newPassphrase = "";
          newPassphraseConfirm = "";
          newPasswordStrength = null;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="form-group svelte-1uha8ag"><label for="current-pass" class="svelte-1uha8ag">Current Passphrase</label> <input id="current-pass" type="password"${attr("value", currentPassphrase)} placeholder="Enter current passphrase..." class="svelte-1uha8ag"/></div> <div class="form-group svelte-1uha8ag"><label for="new-pass" class="svelte-1uha8ag">New Passphrase</label> <input id="new-pass" type="password"${attr("value", newPassphrase)} placeholder="Enter new passphrase..." class="svelte-1uha8ag"/> `);
          if (newPasswordStrength) {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<div class="password-strength svelte-1uha8ag"><div class="strength-bar svelte-1uha8ag"><div${attr_class("strength-fill svelte-1uha8ag", void 0, {
              "very-weak": newPasswordStrength.level === "very_weak",
              "weak": newPasswordStrength.level === "weak",
              "fair": newPasswordStrength.level === "fair",
              "strong": newPasswordStrength.level === "strong",
              "very-strong": newPasswordStrength.level === "very_strong"
            })}${attr_style(`width: ${stringify(newPasswordStrength.score)}%`)}></div></div> <span${attr_class("strength-label svelte-1uha8ag", void 0, {
              "very-weak": newPasswordStrength.level === "very_weak",
              "weak": newPasswordStrength.level === "weak",
              "fair": newPasswordStrength.level === "fair",
              "strong": newPasswordStrength.level === "strong",
              "very-strong": newPasswordStrength.level === "very_strong"
            })}>${escape_html(newPasswordStrength.label)}</span></div>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div> <div class="form-group svelte-1uha8ag"><label for="new-pass-confirm" class="svelte-1uha8ag">Confirm New Passphrase</label> <input id="new-pass-confirm" type="password"${attr("value", newPassphraseConfirm)} placeholder="Confirm new passphrase..." class="svelte-1uha8ag"/> `);
          if (newPassphraseConfirm && newPassphrase !== newPassphraseConfirm) {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<span class="form-error svelte-1uha8ag">Passphrases do not match</span>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn primary svelte-1uha8ag"${attr("disabled", !currentPassphrase || !newPassphrase || newPassphrase !== newPassphraseConfirm, true)}>Change Passphrase</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      Modal($$renderer3, {
        title: "Remove Encryption",
        open: showRemoveEncryption,
        onclose: () => {
          showRemoveEncryption = false;
          removeEncryptionPassphrase = "";
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="encryption-warning danger svelte-1uha8ag"><span class="warning-icon svelte-1uha8ag">⚠️</span> <p class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Warning:</strong> Removing encryption will make your database accessible without a passphrase. Anyone with access to your computer could view your financial data.</p></div> <div class="form-group svelte-1uha8ag"><label for="remove-pass" class="svelte-1uha8ag">Enter Passphrase to Confirm</label> <input id="remove-pass" type="password"${attr("value", removeEncryptionPassphrase)} placeholder="Enter current passphrase..." class="svelte-1uha8ag"/></div> <div class="form-actions svelte-1uha8ag"><button class="btn secondary svelte-1uha8ag">Cancel</button> <button class="btn danger svelte-1uha8ag"${attr("disabled", !removeEncryptionPassphrase, true)}>Remove Encryption</button></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      ConfirmDialog($$renderer3, {
        open: showResetConfirm,
        title: "Reset All Data",
        message: "Are you sure you want to delete ALL your data? This includes all wallets, transactions, accounts, and settings. This action cannot be undone.",
        confirmText: "Yes, Reset Everything",
        danger: true,
        onconfirm: resetAllData,
        onclose: () => showResetConfirm = false
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
