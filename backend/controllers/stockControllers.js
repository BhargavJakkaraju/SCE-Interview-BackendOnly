const { stockHistory, activeIntervals } = require('../data/stockHistory');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function fetchStockData(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  return {
    open: data.o,
    high: data.h,
    low: data.l,
    currentPrice: data.c,
    previousClose: data.pc,
    time: new Date().toISOString()
  };
}

//post
exports.startMonitoring = async (req, res) => {
  const { symbol, minutes, seconds } = req.body;

  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return res.status(400).json({ error: 'symbol must be a non-empty string' });
  }
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || minutes < 0 || seconds < 0) {
    return res.status(400).json({ error: 'minutes and seconds must be non-negative integers' });
  }

  const intervalMs = (minutes * 60 + seconds) * 1000;

  if (intervalMs === 0) {
    return res.status(400).json({ error: 'Total interval must be greater than 0' });
  }

  if (activeIntervals[symbol]) {
    clearInterval(activeIntervals[symbol]);
  }

  if (!stockHistory[symbol]) {
    stockHistory[symbol] = [];
  }

  try {
    const firstEntry = await fetchStockData(symbol);
    stockHistory[symbol].push(firstEntry);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch initial stock data' });
  }

  const intervalId = setInterval(async () => {
    try {
      const entry = await fetchStockData(symbol);
      stockHistory[symbol].push(entry);
      console.log(`Fetched data for ${symbol}:`, entry);
    } catch (err) {
      console.error(`Failed to fetch data for ${symbol}:`, err);
    }
  }, intervalMs);

  activeIntervals[symbol] = intervalId;

  res.json({ message: `Started monitoring ${symbol} every ${minutes}m ${seconds}s` });
};

//get
exports.getHistory = (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol query parameter is required' });
  }

  const history = stockHistory[symbol];

  if (!history) {
    return res.status(404).json({ error: `No history found for symbol ${symbol}` });
  }

  res.json(history);
};

// post
exports.refresh = async (req, res) => {
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return res.status(400).json({ error: 'symbol must be a non-empty string' });
  }

  if (!stockHistory[symbol]) {
    stockHistory[symbol] = [];
  }

  try {
    const entry = await fetchStockData(symbol);
    stockHistory[symbol].push(entry);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};