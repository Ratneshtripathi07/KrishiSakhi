import 'dotenv/config';
import { fallbackLookup, fallbackStates, fallbackCities } from '../services/LocationFallback';

async function main() {
  const states = fallbackStates();
  console.log('states.count', states.length, states.slice(0, 10));
  const list = fallbackLookup('683572');
  console.log('lookup.683572.count', list.length);
  if (list.length) {
    console.log('sample', list.slice(0, 3));
  }
  const kCities = fallbackCities('KERALA');
  console.log('cities.kerala.count', kCities.length, kCities.slice(0, 10));
}

main().catch((e) => {
  console.error('debug_fallback error', e);
  process.exit(1);
});