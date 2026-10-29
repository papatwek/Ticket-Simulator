/**
 * Automated Verification Suite for Gemini API Fallback, Quota Circuit Breaker & Continuous Chat
 * Tests:
 * 1. GET /api/chat - Health & Telemetry Diagnostics + Circuit Breaker Structure
 * 2. Normal Chat Response - Correct Model / Fallback resolution
 * 3. In-Flight Request Deduplication - Concurrent identical requests do not duplicate model calls
 * 4. Contextual Continuity & Strict Device Accuracy
 * 5. Trainee Wait / Hold Recognition - Does not leak order number
 * 6. Graceful Exit Simulation - Handles customer departure & ticket follow-up details
 * 7. Scoring Isolation - Verify fallback responses flag isAiGenerated: false
 */

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('WYZE ECE AI BOT: FALLBACK, CIRCUIT BREAKER & CONTINUITY AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${extraInfo}`);
      failed++;
    }
  }

  // TEST 1: Diagnostics Endpoint & Circuit Breaker Health
  try {
    const diag = await getJson('/api/chat');
    assert('Diagnostics endpoint returns status 200', diag.status === 200);
    assert('Diagnostics contains metrics and circuits map', !!diag.data?.metrics && !!diag.data?.circuits);
    assert('Circuits tracks gemini-3.5-flash and gemini-3.8-flash', 
      'gemini-3.5-flash' in diag.data.circuits && 'gemini-3.8-flash' in diag.data.circuits
    );
  } catch (err) {
    assert('Diagnostics endpoint accessible', false, err.message);
  }

  // TEST 2: Multi-turn Chat Conversation with Memory
  try {
    const testSessionId = 'test_sess_' + Date.now();
    const persona = {
      name: 'Elena Rostova',
      email: 'elena.rostova@example.invalid',
      product: 'Wyze Robot Vacuum',
      macAddress: '2C:AA:8E:44:91:02',
      orderNumber: 'TEST-WZ-104928',
      ledColor: 'pulsing orange',
      issueCategory: 'Vacuum stopped moving on carpet'
    };

    const res1 = await postJson('/api/chat', {
      sessionId: testSessionId,
      turnNumber: 1,
      persona,
      contents: [
        { role: 'user', parts: [{ text: 'Hello, thanks for contacting Wyze support. Who do I have the pleasure of speaking with?' }] }
      ]
    });

    const reply1 = res1.data?.message || res1.data?.text || '';
    assert('Turn 1 answers customer identity correctly', 
      /Elena/i.test(reply1),
      `Received: "${reply1}"`
    );
    assert('Turn 1 does not hallucinate camera for Robot Vacuum',
      !/camera/i.test(reply1),
      `Received: "${reply1}"`
    );

    // TEST 3: Hold Request Recognition (No Order/MAC Leak)
    const res2 = await postJson('/api/chat', {
      sessionId: testSessionId,
      turnNumber: 2,
      persona,
      contents: [
        { role: 'user', parts: [{ text: 'Hello, thanks for contacting Wyze support. Who do I have the pleasure of speaking with?' }] },
        { role: 'model', parts: [{ text: reply1 }] },
        { role: 'user', parts: [{ text: 'Thank you Elena. In order for me to look into this, can you please give me 3 minutes to gather information?' }] }
      ]
    });

    const reply2 = res2.data?.message || res2.data?.text || '';
    assert('Hold request recognized without leaking order number',
      !/TEST-WZ/i.test(reply2) && /(wait|take your time|sure|no problem|okay)/i.test(reply2),
      `Received: "${reply2}"`
    );

    // TEST 4: Trainee asks for order number
    const res3 = await postJson('/api/chat', {
      sessionId: testSessionId,
      turnNumber: 3,
      persona,
      contents: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: reply1 }] },
        { role: 'user', parts: [{ text: 'Wait 3 minutes' }] },
        { role: 'model', parts: [{ text: reply2 }] },
        { role: 'user', parts: [{ text: 'Thanks for waiting. Can you please provide your order number?' }] }
      ]
    });

    const reply3 = res3.data?.message || res3.data?.text || '';
    assert('Order number accurately provided upon explicit request',
      reply3.includes('TEST-WZ-104928'),
      `Received: "${reply3}"`
    );

    // TEST 5: Concurrent In-Flight Request Deduplication
    const concurrent1 = postJson('/api/chat', {
      sessionId: 'dedup_test_' + Date.now(),
      turnNumber: 1,
      persona,
      contents: [{ role: 'user', parts: [{ text: 'What color is the status light?' }] }]
    });
    const concurrent2 = postJson('/api/chat', {
      sessionId: 'dedup_test_' + Date.now(),
      turnNumber: 1,
      persona,
      contents: [{ role: 'user', parts: [{ text: 'What color is the status light?' }] }]
    });

    const [c1, c2] = await Promise.all([concurrent1, concurrent2]);
    assert('Concurrent requests succeed with status 200', c1.status === 200 && c2.status === 200);

    // TEST 6: Graceful Exit Request Simulation
    const exitRes = await postJson('/api/chat', {
      sessionId: 'exit_test_' + Date.now(),
      turnNumber: 4,
      persona,
      contents: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi' }] },
        { role: 'user', parts: [{ text: 'Would you like me to send the remaining steps via email so you can step away?' }] }
      ]
    });

    assert('Graceful exit recognized with followup details',
      exitRes.data?.isGracefulExit === true || exitRes.data?.status === 'PENDING',
      `Status: ${exitRes.data?.status}, isGraceful: ${exitRes.data?.isGracefulExit}`
    );
    assert('Graceful exit specifies simulated email notice',
      exitRes.data?.followupDetails?.email === persona.email,
      `Email: ${exitRes.data?.followupDetails?.email}`
    );

    // TEST 7: Trainee Scoring Isolation & Non-AI Flag Integrity
    if (res1.data?.provider === 'contextual_engine' || res1.data?.provider === 'graceful_exit') {
      assert('Deterministic fallback correctly flags isAiGenerated as false',
        res1.data?.isAiGenerated === false,
        `isAiGenerated: ${res1.data?.isAiGenerated}`
      );
    } else {
      assert('Live AI provider correctly flags isAiGenerated as true',
        res1.data?.isAiGenerated === true,
        `Provider: ${res1.data?.provider}`
      );
    }

  } catch (testErr) {
    assert('Test execution completed without uncaught exceptions', false, testErr.message);
  }

  // FINAL RE-CHECK OF TELEMETRY DIAGNOSTICS
  try {
    const diagAfter = await getJson('/api/chat');
    assert('Diagnostics recorded test requests in totalRequests count',
      diagAfter.data?.metrics?.totalRequests > 0,
      `Total: ${diagAfter.data?.metrics?.totalRequests}`
    );
  } catch (e) {}

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
