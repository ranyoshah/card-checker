// Gets today's exchange rates so prices can be shown in Indian rupees.
// Tries two free services (no API key needed). If both are down, it falls
// back to rough fixed rates and marks the result as "approximate".

const FALLBACK = { usdToInr: 88, eurToInr: 102 };

async function fromFrankfurter() {
  // European Central Bank rates, updated every working day.
  const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=INR,USD', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Frankfurter replied ${res.status}`);
  const data = await res.json();
  const eurToInr = data?.rates?.INR;
  const eurToUsd = data?.rates?.USD;
  if (!eurToInr || !eurToUsd) throw new Error('Frankfurter data incomplete');
  return {
    usdToInr: eurToInr / eurToUsd,
    eurToInr,
    source: 'Frankfurter (European Central Bank)',
    date: data.date,
    approximate: false,
  };
}

async function fromOpenErApi() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`open.er-api replied ${res.status}`);
  const data = await res.json();
  const usdToInr = data?.rates?.INR;
  const usdToEur = data?.rates?.EUR;
  if (!usdToInr || !usdToEur) throw new Error('open.er-api data incomplete');
  return {
    usdToInr,
    eurToInr: usdToInr / usdToEur,
    source: 'ExchangeRate-API',
    date: data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().slice(0, 10) : null,
    approximate: false,
  };
}

export async function getInrRates() {
  for (const source of [fromFrankfurter, fromOpenErApi]) {
    try {
      return await source();
    } catch {
      // try the next source
    }
  }
  return { ...FALLBACK, source: 'Fixed fallback rates', date: null, approximate: true };
}
