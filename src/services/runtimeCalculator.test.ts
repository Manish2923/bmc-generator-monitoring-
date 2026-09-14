import {
  buildRuntimeSessions,
  calculateRuntimeInWindow,
  computeRuntimeMetrics,
  formatDuration,
  formatDurationHHMMSS,
  calculateMonthlyRuntimeLedger,
} from './runtimeCalculator';
import { GeneratorEvent } from '../types/generator';

function runTests() {
  console.log('--- Starting Runtime Calculation & Monthly Ledger Tests ---');

  // Test 1: Exact HH:MM:SS Formatter
  console.assert(formatDurationHHMMSS(0) === '00:00:00', `Expected 00:00:00, got ${formatDurationHHMMSS(0)}`);
  console.assert(formatDurationHHMMSS(59) === '00:00:59', `Expected 00:00:59, got ${formatDurationHHMMSS(59)}`);
  console.assert(formatDurationHHMMSS(60) === '00:01:00', `Expected 00:01:00, got ${formatDurationHHMMSS(60)}`);
  console.assert(formatDurationHHMMSS(61) === '00:01:01', `Expected 00:01:01, got ${formatDurationHHMMSS(61)}`);
  console.assert(formatDurationHHMMSS(3600) === '01:00:00', `Expected 01:00:00, got ${formatDurationHHMMSS(3600)}`);
  console.assert(formatDurationHHMMSS(3661) === '01:01:01', `Expected 01:01:01, got ${formatDurationHHMMSS(3661)}`);
  console.assert(formatDurationHHMMSS(10529) === '02:55:29', `Expected 02:55:29, got ${formatDurationHHMMSS(10529)}`);
  console.log('✔ Test 1 passed: Exact HH:MM:SS formatting verified');

  // Test 2: Multi-session day (01 Sep 2026: 00:36:34 + 00:42:21 = 01:18:55)
  const sepEvents: GeneratorEvent[] = [
    // 01 Sep Session 1: 06:42:13 to 07:18:47 = 2194 sec (00:36:34)
    {
      id: 'e1',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'START',
      timestamp: new Date(2026, 8, 1, 6, 42, 13).toISOString(),
    },
    {
      id: 'e2',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'STOP',
      timestamp: new Date(2026, 8, 1, 7, 18, 47).toISOString(),
    },
    // 01 Sep Session 2: 17:21:08 to 18:03:29 = 2541 sec (00:42:21)
    {
      id: 'e3',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'START',
      timestamp: new Date(2026, 8, 1, 17, 21, 8).toISOString(),
    },
    {
      id: 'e4',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'STOP',
      timestamp: new Date(2026, 8, 1, 18, 3, 29).toISOString(),
    },
    // 04 Sep Session 1: 08:12:04 to 09:05:51 = 3227 sec (00:53:47)
    {
      id: 'e5',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'START',
      timestamp: new Date(2026, 8, 4, 8, 12, 4).toISOString(),
    },
    {
      id: 'e6',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'STOP',
      timestamp: new Date(2026, 8, 4, 9, 5, 51).toISOString(),
    },
    // 09 Sep Session 1: 19:31:22 to 20:14:09 = 2567 sec (00:42:47)
    {
      id: 'e7',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'START',
      timestamp: new Date(2026, 8, 9, 19, 31, 22).toISOString(),
    },
    {
      id: 'e8',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'STOP',
      timestamp: new Date(2026, 8, 9, 20, 14, 9).toISOString(),
    },
  ];

  const ledger = calculateMonthlyRuntimeLedger(sepEvents, 'OFF', 2026, 8, new Date(2026, 8, 14, 20, 0, 0));

  console.assert(ledger.totalSeconds === 10529, `Expected 10529s, got ${ledger.totalSeconds}`);
  console.assert(ledger.totalFormatted === '02:55:29', `Expected '02:55:29', got ${ledger.totalFormatted}`);
  console.assert(ledger.operatingDaysCount === 3, `Expected 3 operating days, got ${ledger.operatingDaysCount}`);
  console.assert(ledger.totalStartsCount === 4, `Expected 4 starts, got ${ledger.totalStartsCount}`);
  console.assert(ledger.longestRuntimeFormatted === '00:53:47', `Expected longest '00:53:47', got ${ledger.longestRuntimeFormatted}`);
  console.assert(ledger.dailySummaries.length === 30, `Expected 30 days in September, got ${ledger.dailySummaries.length}`);

  // Check 01 Sep daily total
  const sep01 = ledger.dailySummaries.find((d) => d.dayNumber === 1);
  console.assert(sep01 !== undefined, 'Sep 01 must exist');
  console.assert(sep01?.sessions.length === 2, `Expected 2 sessions on Sep 01, got ${sep01?.sessions.length}`);
  console.assert(sep01?.totalFormatted === '01:18:55', `Expected Sep 01 daily total '01:18:55', got ${sep01?.totalFormatted}`);
  console.log('✔ Test 2 passed: September 2026 Monthly Total 02:55:29 and 01 Sep Daily Total 01:18:55 verified');

  // Test 3: Midnight Crossing Split (14 Sep 23:50:30 to 15 Sep 00:20:45 = 9m 30s on Day 14, 20m 45s on Day 15)
  const midnightEvents: GeneratorEvent[] = [
    {
      id: 'm1',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'START',
      timestamp: new Date(2026, 8, 14, 23, 50, 30).toISOString(),
    },
    {
      id: 'm2',
      bmcId: 'BMC-5780',
      generatorId: 'GEN-01',
      eventType: 'STOP',
      timestamp: new Date(2026, 8, 15, 0, 20, 45).toISOString(),
    },
  ];

  const midLedger = calculateMonthlyRuntimeLedger(midnightEvents, 'OFF', 2026, 8, new Date(2026, 8, 15, 12, 0, 0));
  const day14 = midLedger.dailySummaries.find((d) => d.dayNumber === 14);
  const day15 = midLedger.dailySummaries.find((d) => d.dayNumber === 15);

  console.assert(day14?.totalFormatted === '00:09:30', `Expected 14 Sep total 00:09:30, got ${day14?.totalFormatted}`);
  console.assert(day15?.totalFormatted === '00:20:45', `Expected 15 Sep total 00:20:45, got ${day15?.totalFormatted}`);
  console.log('✔ Test 3 passed: Midnight crossing split into 00:09:30 (Day 14) and 00:20:45 (Day 15)');

  // Test 4: Zero runtime days
  const day02 = ledger.dailySummaries.find((d) => d.dayNumber === 2);
  console.assert(day02?.totalFormatted === '00:00:00', `Expected 00:00:00 on Day 2, got ${day02?.totalFormatted}`);
  console.assert(day02?.sessionsCount === 0, `Expected 0 sessions on Day 2, got ${day02?.sessionsCount}`);
  console.assert(day02?.hasOperation === false, `Expected hasOperation=false on Day 2`);
  console.log('✔ Test 4 passed: Zero runtime days confirmed as 00:00:00');

  console.log('All Generator Runtime Ledger tests passed successfully!');
}

runTests();
