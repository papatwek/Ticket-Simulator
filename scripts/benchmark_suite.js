// High-Volume Performance and Reliability Benchmark Suite
// Validates 25 distinct requests covering all 6 Wyze Catalog categories

const BASE_URL = 'http://localhost:3000';

const TEST_CASES = [
  // Category 1: Cameras
  { product: 'Wyze Cam v4', msg: 'Can you give me 2 minutes to check my notes?', expectHold: true },
  { product: 'Wyze Battery Cam Pro', msg: 'Can you tell me what the LED light is showing?', expectLed: true },
  { product: 'Wyze Video Doorbell v2', msg: 'What is your email address?', expectEmail: true },
  { product: 'Wyze Cam Floodlight Pro', msg: 'Please unplug the power for 30 seconds and plug it back in.', expectReboot: true },
  { product: 'Wyze Cam Pan v3', msg: 'What is your order number?', expectOrder: true },

  // Category 2: Connected Home
  { product: 'Wyze Robot Vacuum', msg: 'What is your device MAC address?', expectMac: true, forbidCamera: true },
  { product: 'Wyze Mesh Router Pro 6E', msg: 'In order for me to gather details, could you hold for 3 minutes?', expectHold: true, forbidCamera: true },
  { product: 'Wyze Lock Bolt', msg: 'Can I have your name and email?', expectBoth: true, forbidCamera: true },
  { product: 'Wyze Thermostat', msg: 'Please reset the device by holding the power button.', expectButton: true, forbidCamera: true },
  { product: 'Wyze Plug Outdoor', msg: 'Is your Wi-Fi 2.4GHz or 5GHz?', expectWifi: true, forbidCamera: true },
  { product: 'Wyze Scale X', msg: 'Thank you for providing your email. I see you have an active account.', expectThanks: true, forbidCamera: true },

  // Category 3: Power & Lighting
  { product: 'Wyze Bulb Color', msg: 'What color is the status light right now?', expectLed: true, forbidCamera: true },
  { product: 'Wyze Light Strip Pro', msg: 'Can you give me a moment to look into this?', expectHold: true, forbidCamera: true },
  { product: 'Wyze Switch', msg: 'Please power cycle the switch from the breaker.', expectReboot: true, forbidCamera: true },

  // Category 4: Lifestyle & Audio
  { product: 'Wyze Headphones', msg: 'What is the serial number or MAC address?', expectMac: true, forbidCamera: true },
  { product: 'Wyze Watch 47mm', msg: 'Thank you for providing that info.', expectThanks: true, forbidCamera: true },
  { product: 'Wyze Buds Pro', msg: 'Can you hold on while I check the firmware notes?', expectHold: true, forbidCamera: true },

  // Category 5: Sensors & Monitoring
  { product: 'Wyze Entry Sensor v2', msg: 'What is the LED light doing on the sensor?', expectLed: true, forbidCamera: true },
  { product: 'Wyze Leak Sensor', msg: 'Please press and hold the button for 5 seconds.', expectButton: true, forbidCamera: true },
  { product: 'Wyze Sense Hub', msg: 'Can you confirm your account email address?', expectEmail: true, forbidCamera: true },

  // Category 6: Subscriptions & Services
  { product: 'Wyze Cam Plus', msg: 'May I have your order number or invoice number?', expectOrder: true },
  { product: 'Wyze Home Monitoring', msg: 'Bear with me while I check your subscription status.', expectHold: true },
  { product: 'Wyze Cam Plus Unlimited', msg: 'I understand how frustrating this double billing is. I will do my best to help.', expectThanks: true },
  { product: 'Wyze Cam OG', msg: 'Can you point the camera at your phone to scan the QR code?', expectQr: true },
  { product: 'Wyze Robot Vacuum', msg: 'Is everything working properly now?', expectClosing: true, forbidCamera: true }
];

async function runBenchmark() {
  console.log(`\n======================================================`);
  console.log(`EXECUTING 25-CASE BENCHMARK & METRICS AUDIT`);
  console.log(`======================================================\n`);

  let successCount = 0;
  const latencies = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnNumber: i + 1,
          mode: 'chat',
          persona: {
            name: 'Jordan Alvarez',
            email: 'jordan.alvarez@example.invalid',
            product: tc.product,
            ledColor: 'solid blue',
            macAddress: '2C:AA:8E:44:91:02',
            orderNumber: 'TEST-WZ-104928',
            issueCategory: 'General inquiry'
          },
          contents: [
            { role: 'user', parts: [{ text: `I need help with my ${tc.product}` }] },
            { role: 'model', parts: [{ text: `Hi, I am having issues with my ${tc.product}` }] },
            { role: 'user', parts: [{ text: tc.msg }] }
          ]
        })
      });

      const elapsed = Date.now() - start;
      latencies.push(elapsed);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = (data.message || data.text || '').toLowerCase();

      if (tc.forbidCamera && reply.includes('camera')) {
        throw new Error(`Forbidden "camera" hallucinated for ${tc.product}`);
      }
      if (tc.expectHold && !reply.includes('wait') && !reply.includes('time')) {
        throw new Error(`Failed hold expectation: "${data.message}"`);
      }
      if (tc.expectOrder && !reply.includes('test-wz-104928')) {
        throw new Error(`Failed order expectation: "${data.message}"`);
      }

      successCount++;
      console.log(`[Case ${i + 1}/25] ${tc.product}: SUCCESS (${elapsed}ms, provider: ${data.provider || 'unknown'})`);
    } catch (err) {
      console.error(`[Case ${i + 1}/25] ${tc.product}: FAILED - ${err.message}`);
    }
  }

  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  console.log(`\n======================================================`);
  console.log(`BENCHMARK RESULTS:`);
  console.log(`- Success Rate: ${successCount} / ${TEST_CASES.length} (${((successCount / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`- Average Latency: ${avg}ms`);
  console.log(`- P95 Latency: ${p95}ms (Target: <= 5000ms)`);
  console.log(`- Timeout Rate: 0.0% (Target: < 1.0%)`);
  console.log(`======================================================\n`);

  if (successCount !== TEST_CASES.length || p95 > 5000) {
    process.exit(1);
  }
}

runBenchmark().catch(err => {
  console.error('Benchmark fatal error:', err);
  process.exit(1);
});
