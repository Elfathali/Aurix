const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "NGN", "GHS", "KES"];

const normalizeCurrency = (currency = "EUR") => String(currency).toUpperCase();

const normalizeBalances = (wallet) => {
  const balances = {};

  for (const currency of SUPPORTED_CURRENCIES) {
    balances[currency] = Number(wallet.balances?.[currency] || 0);
  }

  if (balances.EUR === 0 && Number(wallet.balance || 0) > 0) {
    balances.EUR = Number(wallet.balance || 0);
  }

  return balances;
};

const ensureWalletBalances = (wallet) => {
  wallet.balances = normalizeBalances(wallet);
  wallet.balance = wallet.balances.EUR;
};

const getCurrencyBalance = (wallet, currency = "EUR") => {
  const normalized = normalizeCurrency(currency);
  return normalizeBalances(wallet)[normalized] || 0;
};

const setCurrencyBalance = (wallet, currency, amount) => {
  const normalized = normalizeCurrency(currency);
  const balances = normalizeBalances(wallet);

  if (!SUPPORTED_CURRENCIES.includes(normalized)) {
    throw new Error(`Unsupported currency ${normalized}`);
  }

  balances[normalized] = Math.round(Number(amount) * 100) / 100;
  wallet.balances = balances;
  wallet.balance = balances.EUR;
};

const adjustCurrencyBalance = (wallet, currency, delta) => {
  const current = getCurrencyBalance(wallet, currency);
  setCurrencyBalance(wallet, currency, current + Number(delta));
};

module.exports = {
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  normalizeBalances,
  ensureWalletBalances,
  getCurrencyBalance,
  setCurrencyBalance,
  adjustCurrencyBalance
};
