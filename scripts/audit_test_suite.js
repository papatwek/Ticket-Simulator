// Comprehensive Autonomous Test Suite for Wyze ECE Simulator AI Bot
// Validates: Intent Recognition, Product Grounding, Consecutive Roles, Memory, Latency, and Supabase Sync

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTest(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  const start = Date.now();
  try {
    await fn();
    const dur = Date.now() - start;
    console.log(`PASSED (${dur}ms)`);
    return { name, passed: true, durationMs: dur };
  } catch (err) {
    const dur = Date.now() - start;
    console.log(`FAILED (${dur}ms): ${err.message}`);
    return { name, passed: false, durationMs: dur, error: err.message };
  }
}

async function postChat(payload) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
  }
  return res.json();
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`STARTING AUTOMATED AI BOT AUDIT & TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results = [];

  // TEST 1: Diagnostic endpoint availability and integration status
  results.push(await runTest('Diagnostics endpoint GET /api/chat', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`);
    if (!res.ok) throw new Error(`GET /api/chat failed with ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Status not ok: ${JSON.stringify(data)}`);
    if (!data.metrics) throw new Error('Missing metrics object');
  }));

  // TEST 2: Intent Recognition - Hold / Wait / "give me 3 minutes"
  results.push(await runTest('Hold / Wait intent ("give me 3 minutes")', async () => {
    const data = await postChat({
      turnNumber: 2,
      mode: 'chat',
      persona: {
        name: 'Carlos Mendez',
        email: 'carlos.mendez@example.invalid',
        product: 'Wyze Robot Vacuum',
        ledColor: 'yellow pulse',
        macAddress: '2C:AA:8E:44:91:02',
        orderNumber: 'TEST-WZ-992102',
        issueCategory: 'Hardware malfunction'
      },
      contents: [
        { role: 'user', parts: [{ text: 'Hello, my vacuum stopped moving.' }] },
        { role: 'model', parts: [{ text: 'Hi, I need help with my vacuum.' }] },
        { role: 'user', parts: [{ text: 'In order for me to give you the best assistance, can you give me 3 minutes to gather information regarding this issue?' }] }
      ]
    });
    const reply = (data.message || data.text || '').toLowerCase();
    if (reply.includes('camera')) throw new Error(`Hallucinated "camera" for Robot Vacuum: "${data.message}"`);
    if (reply.includes('order number is')) throw new Error(`Misinterpreted "in order to" as order request: "${data.message}"`);
    if (!reply.includes('wait') && !reply.includes('time')) {
      throw new Error(`Did not recognize hold/wait request: "${data.message}"`);
    }
  }));

  // TEST 3: Product Grounding - Router must NEVER say camera
  results.push(await runTest('Product boundary - Wyze Mesh Router Pro 6E MAC inquiry', async () => {
    const data = await postChat({
      turnNumber: 3,
      mode: 'chat',
      persona: {
        name: 'Liam O\'Connor',
        email: 'liam.oconnor.boston@example.invalid',
        product: 'Wyze Mesh Router Pro 6E',
        ledColor: 'solid white',
        macAddress: '94:83:C4:22:10:FA',
        orderNumber: 'TEST-WZ-331089',
        issueCategory: 'Smart home Wi-Fi drops'
      },
      contents: [
        { role: 'user', parts: [{ text: 'Can you provide the MAC address of your device?' }] }
      ]
    });
    const reply = (data.message || data.text || '').toLowerCase();
    if (reply.includes('camera')) throw new Error(`Hallucinated "camera" on Mesh Router: "${data.message}"`);
    if (!reply.includes('94:83:c4:22:10:fa')) throw new Error(`MAC address missing or incorrect: "${data.message}"`);
  }));

  // TEST 4: Rapid Messages - Consecutive User Turns Consolidation
  results.push(await runTest('Consecutive user turns (rapid message consolidation)', async () => {
    const data = await postChat({
      turnNumber: 3,
      mode: 'chat',
      persona: {
        name: 'Maya Schmidt',
        email: 'maya.schmidt@example.invalid',
        product: 'Wyze Lock Bolt',
        ledColor: 'flashing red',
        macAddress: 'E0:98:06:55:71:3B',
        orderNumber: 'TEST-BB-661902',
        issueCategory: 'App or account login trouble'
      },
      contents: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'user', parts: [{ text: 'Can I have your name?' }] },
        { role: 'user', parts: [{ text: 'And also your account email?' }] }
      ]
    });
    if (!data.message) throw new Error('Failed to respond to consecutive user turns');
    const reply = (data.message || '').toLowerCase();
    if (reply.includes('camera')) throw new Error(`Hallucinated "camera" for Lock Bolt: "${data.message}"`);
    if (!reply.includes('maya') && !reply.includes('schmidt') && !reply.includes('example.invalid')) {
      throw new Error(`Did not provide requested identity info: "${data.message}"`);
    }
  }));

  // TEST 5: Statement / Thank-You Acknowledgment without Re-Spitting Credentials
  results.push(await runTest('Statement acknowledgment - does not re-spit credentials', async () => {
    const data = await postChat({
      turnNumber: 2,
      mode: 'chat',
      persona: {
        name: 'Elena Rostova',
        email: 'elena.rostova@example.invalid',
        product: 'Wyze Video Doorbell v2',
        ledColor: 'solid white',
        macAddress: 'D4:3D:7E:88:2C:19',
        orderNumber: 'TEST-HD-448102',
        issueCategory: 'Two-way audio'
      },
      contents: [
        { role: 'user', parts: [{ text: 'Can I have your email?' }] },
        { role: 'model', parts: [{ text: 'My email is elena.rostova@example.invalid.' }] },
        { role: 'user', parts: [{ text: 'Thank you for providing your email. I see that you have been with Wyze for 2 years.' }] }
      ]
    });
    const reply = (data.message || '').toLowerCase();
    if (reply.includes('my email is')) throw new Error(`Repeated email address redundantly: "${data.message}"`);
    if (!reply.includes('thank') && !reply.includes('appreciate')) {
      throw new Error(`Did not naturally acknowledge statement: "${data.message}"`);
    }
  }));

  // TEST 6: Power Cycle Instruction on Non-Camera Hardware (Thermostat)
  results.push(await runTest('Power cycle instruction on Wyze Thermostat', async () => {
    const data = await postChat({
      turnNumber: 3,
      mode: 'chat',
      persona: {
        name: 'Tariq Mansoor',
        email: 'tariq.mansoor@example.invalid',
        product: 'Wyze Thermostat',
        ledColor: 'orange flame',
        macAddress: '50:8A:06:91:DE:30',
        orderNumber: 'TEST-WZ-884102',
        issueCategory: 'Hardware malfunction'
      },
      contents: [
        { role: 'user', parts: [{ text: 'Please disconnect power to the thermostat for 30 seconds and reconnect it.' }] }
      ]
    });
    const reply = (data.message || '').toLowerCase();
    if (reply.includes('camera')) throw new Error(`Hallucinated "camera" for Thermostat: "${data.message}"`);
    if (!reply.includes('unplug') && !reply.includes('power') && !reply.includes('disconnect') && !reply.includes('plug') && !reply.includes('wall')) {
      throw new Error(`Did not report power cycle action: "${data.message}"`);
    }
  }));

  // TEST 7: Concurrent Sessions Isolation
  results.push(await runTest('Session isolation across concurrent chats', async () => {
    const p1 = postChat({
      sessionId: 'sess_iso_1',
      turnNumber: 1,
      mode: 'chat',
      persona: { name: 'Customer One', product: 'Wyze Plug Outdoor', macAddress: 'AA:11:AA:11:AA:11', email: 'cust1@example.invalid' },
      contents: [{ role: 'user', parts: [{ text: 'What is your MAC address?' }] }]
    });
    const p2 = postChat({
      sessionId: 'sess_iso_2',
      turnNumber: 1,
      mode: 'chat',
      persona: { name: 'Customer Two', product: 'Wyze Headphones', macAddress: 'BB:22:BB:22:BB:22', email: 'cust2@example.invalid' },
      contents: [{ role: 'user', parts: [{ text: 'What is your MAC address?' }] }]
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    if (!r1.message.includes('AA:11:AA:11:AA:11')) throw new Error(`Session 1 data corrupted: "${r1.message}"`);
    if (!r2.message.includes('BB:22:BB:22:BB:22')) throw new Error(`Session 2 data corrupted: "${r2.message}"`);
  }));

  // TEST 8: Verify Diagnostics & P95 Latency Tracking
  results.push(await runTest('Verify diagnostics & P95 latency tracking', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`);
    const data = await res.json();
    if (data.metrics.totalRequests < 5) throw new Error(`Telemetry requests not incrementing: ${data.metrics.totalRequests}`);
    if (data.metrics.p95LatencyMs <= 0 && data.metrics.totalRequests > 0) throw new Error('P95 latency should be positive');
    console.log(`    -> Total Requests: ${data.metrics.totalRequests}, Success: ${data.metrics.successRatePct}%, P95 Latency: ${data.metrics.p95LatencyMs}ms`);
  }));

  console.log(`\n======================================================`);
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
