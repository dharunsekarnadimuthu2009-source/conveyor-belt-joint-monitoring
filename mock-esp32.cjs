/**
 * Mock ESP32 HTTP Server for JointSense Conveyor Belt Monitoring System.
 * Implements the exact ESP32 API contract with CORS support:
 * - GET  /api/status
 * - GET  /api/history
 * - POST /api/cmd?c=start|stop|reset|mute
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

let state = {
  run: true,
  relay: true,
  mute: false,
  buzzer: false,
  splice: 1,
  pass: 12,
  d0: 100.0,
  d: 100.3,
  elong: 0.3,
  speedHall: 125.0,
  speedEnc: 124.0,
  slip: false,
  load: 950,
  temp: 29.1,
  tempBase: 29.0,
  sound: 28,
  risk: 5,
  level: 0,
  encCount: 944,
  hall1: 2040,
  hall2: 2033,
  ok: {
    hall1: true,
    hall2: true,
    enc: true,
    load: true,
    temp: true,
    mic: true,
  },
  lim: {
    crit: 5.0,
    load: 3000,
    temp: 8,
    sound: 70,
  },
};

let history = [
  { n: 12, id: 2, d: 100.28, e: 0.28 },
  { n: 11, id: 1, d: 100.30, e: 0.30 },
  { n: 10, id: 2, d: 100.22, e: 0.22 },
  { n: 9, id: 1, d: 100.34, e: 0.34 },
  { n: 8, id: 2, d: 100.25, e: 0.25 },
];

let tick = 0;

// Periodic belt movement simulation
setInterval(() => {
  tick++;
  if (state.run && state.relay) {
    state.encCount += 10;

    // Small natural jitter in readings
    state.d = Math.round((100.25 + Math.sin(tick * 0.2) * 0.1) * 100) / 100;
    state.elong = Math.round((((state.d - state.d0) / state.d0) * 100) * 100) / 100;
    state.load = 940 + Math.round(Math.sin(tick * 0.1) * 35);
    state.temp = Math.round((29.1 + Math.sin(tick * 0.05) * 0.3) * 10) / 10;
    state.sound = 28 + Math.round(Math.sin(tick * 0.3) * 4);
    state.speedHall = Math.round((125.0 + Math.sin(tick * 0.2) * 1.5) * 10) / 10;
    state.speedEnc = Math.round((124.0 + Math.cos(tick * 0.2) * 1.2) * 10) / 10;
    state.slip = Math.abs(state.speedHall - state.speedEnc) > (state.speedHall * 0.1);

    // Simulate splice pass every 30 intervals
    if (tick % 30 === 0) {
      state.pass++;
      state.splice = state.splice === 1 ? 2 : 1;
      history.unshift({
        n: state.pass,
        id: state.splice,
        d: state.d,
        e: state.elong,
      });
      if (history.length > 20) {
        history.pop();
      }
    }
  } else {
    state.speedHall = 0;
    state.speedEnc = 0;
    state.slip = false;
  }
}, 500);

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  if (pathname === '/api/history' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
    return;
  }

  if (pathname === '/api/cmd' && req.method === 'POST') {
    const cmd = parsedUrl.query.c;
    if (cmd === 'start') {
      state.run = true;
      state.relay = true;
      state.buzzer = false;
    } else if (cmd === 'stop') {
      state.run = false;
      state.relay = false;
    } else if (cmd === 'reset') {
      state.d0 = state.d;
      state.elong = 0.0;
    } else if (cmd === 'mute') {
      state.mute = !state.mute;
      if (state.mute) state.buzzer = false;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, cmd, state: { run: state.run, relay: state.relay, mute: state.mute } }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  JointSense Mock ESP32 Server running on port ${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  http://localhost:${PORT}/api/status`);
  console.log(`    GET  http://localhost:${PORT}/api/history`);
  console.log(`    POST http://localhost:${PORT}/api/cmd?c=start|stop|reset|mute`);
  console.log(`======================================================\n`);
});
