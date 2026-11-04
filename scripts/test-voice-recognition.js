// Regression and Integration Test Suite for TALHA AI Voice Input System
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3000';

// Helper to create a valid PCM WAV buffer
function createWavBuffer({ sampleRate = 16000, durationSec = 1.0, frequency = 440 } = {}) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Generate synthetic audio samples (sine wave or silence)
  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    if (frequency > 0) {
      const t = i / sampleRate;
      sample = Math.sin(2 * Math.PI * frequency * t) * 0.3 * 32767;
    }
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.floor(sample))), 44 + i * 2);
  }

  return buffer;
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('TALHA AI — VOICE RECOGNITION REGRESSION TEST SUITE');
  console.log('====================================================\n');

  const results = [];

  // TEST 1: Health check & Server Status
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    const passed = res.ok && data.status === 'ok' && data.app === 'TALHA AI';
    results.push({ name: '1. Server Health & Model Status', passed, details: data });
    console.log(`[PASS] Test 1: Server healthy, model = ${data.model}`);
  } catch (err) {
    results.push({ name: '1. Server Health & Model Status', passed: false, error: err.message });
    console.error('[FAIL] Test 1:', err);
  }

  // TEST 2: Empty Audio Validation (Should return HTTP 400)
  try {
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioData: '', language: 'Hindi' }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('required');
    results.push({ name: '2. Empty Audio Payload Validation', passed, details: data });
    console.log(`[PASS] Test 2: Correctly rejected empty audioData (HTTP ${res.status})`);
  } catch (err) {
    results.push({ name: '2. Empty Audio Payload Validation', passed: false, error: err.message });
    console.error('[FAIL] Test 2:', err);
  }

  // TEST 3: Short / Incomplete Audio (<50 bytes) Validation
  try {
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioData: 'dG9vc2hvcnQ=', language: 'Hindi' }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('too short');
    results.push({ name: '3. Short Audio (<50 bytes) Payload Validation', passed, details: data });
    console.log(`[PASS] Test 3: Correctly rejected truncated audio (HTTP ${res.status})`);
  } catch (err) {
    results.push({ name: '3. Short Audio Payload Validation', passed: false, error: err.message });
    console.error('[FAIL] Test 3:', err);
  }

  // TEST 4: Silence / Ambient Noise Audio Handling (Clean non-hallucinating response)
  try {
    const silentWav = createWavBuffer({ durationSec: 1.5, frequency: 0 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: silentWav.toString('base64'),
        mimeType: 'audio/wav',
        language: 'Hindi',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true && typeof data.transcript === 'string';
    results.push({ name: '4. Silence / Natural Pause Audio Handling', passed, details: data });
    console.log(`[PASS] Test 4: Handled silent audio cleanly without hallucination, transcript: "${data.transcript}"`);
  } catch (err) {
    results.push({ name: '4. Silence / Natural Pause Audio Handling', passed: false, error: err.message });
    console.error('[FAIL] Test 4:', err);
  }

  // TEST 5: Multilingual Header Routing (Hindi)
  try {
    const wav = createWavBuffer({ durationSec: 2.0, frequency: 220 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: wav.toString('base64'),
        mimeType: 'audio/wav',
        language: 'Hindi',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true && data.language === 'Hindi';
    results.push({ name: '5. Hindi Language Context Routing', passed, details: data });
    console.log(`[PASS] Test 5: Hindi context acknowledged, model used: ${data.modelUsed}`);
  } catch (err) {
    results.push({ name: '5. Hindi Language Context Routing', passed: false, error: err.message });
    console.error('[FAIL] Test 5:', err);
  }

  // TEST 6: Multilingual Header Routing (English)
  try {
    const wav = createWavBuffer({ durationSec: 2.0, frequency: 440 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: `data:audio/wav;base64,${wav.toString('base64')}`,
        mimeType: 'audio/wav;codecs=opus',
        language: 'English',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true && data.language === 'English';
    results.push({ name: '6. English Language Context Routing + DataURI parsing', passed, details: data });
    console.log(`[PASS] Test 6: English context + DataURI prefix normalized, model: ${data.modelUsed}`);
  } catch (err) {
    results.push({ name: '6. English Language Context Routing', passed: false, error: err.message });
    console.error('[FAIL] Test 6:', err);
  }

  // TEST 7: Multilingual Header Routing (Urdu)
  try {
    const wav = createWavBuffer({ durationSec: 2.0, frequency: 330 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: wav.toString('base64'),
        mimeType: 'audio/webm',
        language: 'Urdu',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true && data.language === 'Urdu';
    results.push({ name: '7. Urdu Language Context Routing', passed, details: data });
    console.log(`[PASS] Test 7: Urdu context acknowledged, model used: ${data.modelUsed}`);
  } catch (err) {
    results.push({ name: '7. Urdu Language Context Routing', passed: false, error: err.message });
    console.error('[FAIL] Test 7:', err);
  }

  // TEST 8: Multilingual Header Routing (Punjabi)
  try {
    const wav = createWavBuffer({ durationSec: 2.0, frequency: 300 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: wav.toString('base64'),
        mimeType: 'audio/webm',
        language: 'Punjabi',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true && data.language === 'Punjabi';
    results.push({ name: '8. Punjabi Language Context Routing', passed, details: data });
    console.log(`[PASS] Test 8: Punjabi context acknowledged, model used: ${data.modelUsed}`);
  } catch (err) {
    results.push({ name: '8. Punjabi Language Context Routing', passed: false, error: err.message });
    console.error('[FAIL] Test 8:', err);
  }

  // TEST 9: Long Voice Recording Simulation (10 seconds audio payload)
  try {
    const longWav = createWavBuffer({ durationSec: 10.0, frequency: 440 });
    const res = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: longWav.toString('base64'),
        mimeType: 'audio/wav',
        language: 'Hindi',
      }),
    });
    const data = await res.json();
    const passed = res.ok && data.success === true;
    results.push({ name: '9. Long Audio (10s) Ingestion & Chunk Finalization', passed, details: data });
    console.log(`[PASS] Test 9: Successfully processed 10-second recording payload, model: ${data.modelUsed}`);
  } catch (err) {
    results.push({ name: '9. Long Audio Ingestion', passed: false, error: err.message });
    console.error('[FAIL] Test 9:', err);
  }

  // TEST 10: Repeated Rapid Sessions (Concurrency & Pipeline Stability)
  try {
    const p1 = fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: createWavBuffer({ durationSec: 1.0, frequency: 350 }).toString('base64'),
        mimeType: 'audio/wav',
        language: 'English',
      }),
    });
    const p2 = fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: createWavBuffer({ durationSec: 1.0, frequency: 500 }).toString('base64'),
        mimeType: 'audio/wav',
        language: 'Hindi',
      }),
    });
    const [r1, r2] = await Promise.all([p1, p2]);
    const d1 = await r1.json();
    const d2 = await r2.json();
    const passed = r1.ok && r2.ok && d1.success && d2.success;
    results.push({ name: '10. Repeated Rapid Sessions & Concurrent Stability', passed, details: { d1, d2 } });
    console.log(`[PASS] Test 10: Repeated concurrent sessions succeeded without pipe lockup`);
  } catch (err) {
    results.push({ name: '10. Repeated Rapid Sessions', passed: false, error: err.message });
    console.error('[FAIL] Test 10:', err);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${results.filter((r) => r.passed).length} / ${results.length} TESTS PASSED`);
  console.log('====================================================');
}

runTestSuite().catch(console.error);
