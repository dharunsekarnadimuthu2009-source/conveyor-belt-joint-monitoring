# JointSense Dashboard

**JointSense Dashboard** is a production-grade industrial IoT web application for continuous monitoring and predictive failure prevention of conveyor belt splices (joints).

A conveyor belt splice stretches before it tears. Two high-energy neodymium magnets are vulcanized into each belt splice. Two Hall effect sensors detect magnet transit times while an optical/magnetic rotary encoder measures linear belt displacement. The onboard ESP32 controller calculates the inter-magnet gap ($d$) and compares it to a calibrated baseline ($d_0$):

$$\text{stretch } \% = \frac{d - d_0}{d_0} \times 100$$

Secondary telemetry from an **HX711** load cell (belt mechanical tension), a **DS18B20** waterproof digital probe (splice thermal friction), and a **MAX9814** microphone (acoustic joint tearing noise) validate and confirm the stretch signal. When the critical elongation limit is breached, an onboard relay cuts power to the conveyor motor interlock.

> **Safety Architecture Note:** The ESP32 is the primary safety controller and the single source of truth. The web dashboard acts exclusively as a real-time monitor and supervisory control interface. It never overrides the ESP32 firmware's physical safety cutoffs.

---

## Features

- **Live Status & Interlock Banner**: Real-time status display matching industrial alarm color standards:
  - 🟢 **Teal (Normal)**: All splice gaps and auxiliary sensors within normal tolerances.
  - 🟡 **Amber (Warning)**: $\ge 2$ of 3 confirming sensor signals abnormal (load, thermal rise, acoustic noise).
  - 🔴 **Red (Critical)**: Splice elongation $\ge lim.crit$. Firmware motor relay interlock engaged.
- **Risk Score Gauge**: Predictive composite risk score (0–100%) tracking degradation severity.
- **KPI Telemetry Cards**:
  - Splice Stretch Elongation % (with limit line, turns amber/red when crossed).
  - Magnet Gap ($d$ vs baseline $d_0$, with real-time delta $\Delta$).
  - Belt Speed ($Hall$ vs $Encoder$ with automatic wheel slip detection badge).
  - Belt Tension Load ($HX711$).
  - Splice Temperature ($DS18B20$ vs ambient baseline).
  - Acoustic Sound Noise ($MAX9814$).
  - Large-Number Mode toggle for distant visibility in control rooms.
- **Real-Time Waveform Charts**: 4 synchronized Recharts time-series graphs displaying the last 60 samples (configurable to 30, 60, or 120 samples) polled at 500 ms, with dashed threshold reference lines matching effective limits.
- **Sensor Diagnostics Panel**: Live health matrix (`ok` flags) and raw ADC/tick readouts for all 6 hardware channels (Hall 1, Hall 2, Rotary Encoder, HX711 Load Cell, DS18B20 Probe, MAX9814 Microphone).
- **Remote Controls**: Start, Stop (Relay Cut), Reset Baseline ($d_0 \leftarrow d$ with accessible modal confirmation), and Buzzer Mute/Unmute.
- **Splice Pass History**: Real-time table of splice passes with status chips and per-joint analysis (Joint 1 vs Joint 2 pass counts and mean elongation).
- **Event & Alert Log**: Chronological transition log stored in browser `localStorage`.
- **CSV Data Export**: One-click download of both Splice Pass History and Alert Logs formatted as standard RFC-4180 CSV files.
- **Offline Resiliency & Exponential Backoff**: Automatic disconnection detection after $N$ failed polls, visual retry countdown timer, and exponential backoff retry strategy ($1\text{s} \to 2\text{s} \to 4\text{s} \dots$ up to configured maximum).
- **Hardware Demo Simulator**: Built-in physical conveyor simulator with 3 test scenarios (*Healthy*, *Warning from Load + Heat*, and *Critical from Splice Stretch*) allowing full evaluation without physical ESP32 hardware.

---

## Tech Stack

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (dark mode support, comfortable/compact densities)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Data Management**: React Query (`@tanstack/react-query`) + Custom resilient polling hook
- **Testing**: Vitest (pure alert evaluation, slip detection, settings migration, validation)

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (tested on Node v20 / v24)
- **npm** v9+

### Installation

```bash
# Clone or navigate into the project directory
cd Joinsense

# Install dependencies
npm install
```

### Running the App

```bash
# Start Vite development server (listens on http://localhost:3000 and local network IP)
npm run dev
```

Open your browser at `http://localhost:3000`.

### Building for Production

```bash
# Typecheck and build optimized static assets
npm run build

# Preview production build locally
npm run preview
```

### Running Unit Tests

```bash
# Run the Vitest unit test suite
npm run test
```

---

## Testing Without Physical Hardware: Mock ESP32 Server

A zero-dependency Node.js HTTP server is included to emulate the ESP32 hardware API over Wi-Fi. It supports CORS (`Access-Control-Allow-Origin: *`), realistic belt physics, encoder accumulation, and command responses.

```bash
# Launch the mock ESP32 server (runs on port 8080)
npm run mock-esp32
```

In the JointSense Dashboard **Settings** page:
1. Set **ESP32 IP Address** to `localhost` (or `127.0.0.1`).
2. Set **HTTP Port** to `8080`.
3. Click **Test Connection** (returns response time in ms).
4. Click **Save Changes**.

Alternatively, enable **Hardware Demo Simulator Mode** directly in the top header or settings page to simulate conveyor dynamics purely in the browser.

---

## Mixed Content Security Note (HTTP vs HTTPS)

> **IMPORTANT**:
> Modern web browsers enforce the **W3C Mixed Content Specification**. A web page delivered over secure HTTPS (`https://`) is blocked by browser security from issuing unencrypted HTTP (`http://`) requests to private local network IPs (e.g., `http://192.168.4.1/api/status` or `http://192.168.1.x`).
>
> **Recommended Deployment**:
> - Always host and open the JointSense Dashboard over standard **HTTP** (e.g., `http://localhost:3000` or `http://192.168.x.x:3000`) when connecting to the ESP32 on the local factory Wi-Fi subnet.
> - If hosted on a corporate intranet server, serve the dashboard via HTTP or set up a local reverse proxy on the subnet.

---

## ESP32 API Contract

The ESP32 runs an HTTP server on port 80 with the header `Access-Control-Allow-Origin: *`.

### 1. `GET /api/status`

Returns full real-time telemetry snapshot:

```json
{
  "run": true,
  "relay": true,
  "mute": false,
  "buzzer": false,
  "splice": 1,
  "pass": 12,
  "d": 100.30,
  "d0": 100.00,
  "elong": 0.30,
  "speedHall": 125.0,
  "speedEnc": 124.0,
  "slip": false,
  "load": 950,
  "temp": 29.1,
  "tempBase": 29.0,
  "sound": 28,
  "risk": 5,
  "level": 0,
  "encCount": 944,
  "hall1": 2040,
  "hall2": 2033,
  "ok": {
    "hall1": true,
    "hall2": true,
    "enc": true,
    "load": true,
    "temp": true,
    "mic": true
  },
  "lim": {
    "crit": 5.0,
    "load": 3000,
    "temp": 8,
    "sound": 70
  }
}
```

- `level`: `0` = Normal, `1` = Warning, `2` = Critical.
- `elong`: Calculated stretch elongation: `(d - d0) / d0 * 100`.
- `slip`: `true` if Hall speed and rotary encoder speed differ by more than the slip tolerance ($> 10\%$).

### 2. `GET /api/history`

Returns an array of the latest splice passes (newest first, max 20):

```json
[
  { "n": 12, "id": 2, "d": 100.28, "e": 0.28 },
  { "n": 11, "id": 1, "d": 100.30, "e": 0.30 },
  { "n": 10, "id": 2, "d": 100.22, "e": 0.22 }
]
```

### 3. `POST /api/cmd?c=<command>`

Sends an operational command to the ESP32:

| Command | Action |
| :--- | :--- |
| `start` | Energizes relay (`relay = true`), clears buzzer, starts motor (`run = true`). |
| `stop` | Emergency Stop: cuts relay power (`relay = false`), stops motor (`run = false`). |
| `reset` | Re-calibrates baseline gap: sets $d_0 \leftarrow d$ and resets stretch elongation to $0.00\%$. |
| `mute` | Toggles hardware buzzer mute state (`mute = !mute`). |

---

## Settings Reference Table

Settings are persisted in `localStorage` under the versioned key `jointsense.settings.v1` with automated schema migrations.

| Section | Setting | Key | Default | Allowed Range | Unit / Options | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Connection** | ESP32 Target IP | `connection.espIp` | `192.168.4.1` | Valid IPv4 / Hostname | — | Wi-Fi IP or mDNS hostname of ESP32 |
| | HTTP Port | `connection.espPort` | `80` | `1` to `65535` | port # | Web server port |
| | Demo Mode | `connection.demoMode` | `false` | `true` / `false` | boolean | Enables built-in hardware simulator |
| | Demo Scenario | `connection.demoScenario` | `healthy` | `healthy`, `warning`, `critical` | enum | Scenario simulated when Demo Mode is active |
| **Polling** | Poll Interval | `polling.pollInterval` | `500` | `250` to `5000` | ms | Interval between `/api/status` requests |
| | Request Timeout | `polling.requestTimeout` | `1500` | `500` to `5000` | ms | Abort timeout for HTTP requests |
| | Offline Threshold | `polling.offlineThreshold`| `3` | `1` to `10` | failed polls | Number of consecutive poll drops before declaring offline |
| | Max Backoff | `polling.maxBackoff` | `10` | `1` to `60` | seconds | Ceiling for exponential retry backoff |
| | Chart Window | `polling.chartWindow` | `60` | `30`, `60`, `120` | samples | Number of data points rendered on live charts |
| **Alert Thresholds** | Use Device Limits | `thresholds.useDeviceLimits` | `true` | `true` / `false` | boolean | When ON, uses `lim` from ESP32; when OFF, uses dashboard limits |
| | Critical Stretch | `thresholds.criticalStretch` | `5.0` | `0.5` to `20.0` | % (step 0.1) | Critical elongation threshold |
| | Load Limit | `thresholds.loadLimit` | `3000` | `100` to `5000` | pts (step 50) | HX711 belt tension ceiling |
| | Temp Rise Limit | `thresholds.tempRiseLimit` | `8.0` | `1.0` to `30.0` | °C (step 0.5) | Maximum allowable rise above baseline |
| | Sound Level Limit | `thresholds.soundLimit` | `70` | `10` to `100` | index (step 1)| MAX9814 acoustic noise limit |
| | Slip Tolerance | `thresholds.slipTolerance` | `10` | `1` to `30` | % (step 1) | Speed mismatch tolerance before flagging slip |
| **Notifications** | Browser Push | `notifications.browserNotifications`| `false` | `true` / `false` | boolean | Triggers native desktop notifications |
| | Alert Sound | `notifications.alertSound` | `true` | `true` / `false` | boolean | Synthesizes audio warning tones via Web Audio API |
| | Audio Volume | `notifications.soundVolume`| `70` | `0` to `100` | % | Master volume for synth tones |
| | Notify on Warning | `notifications.notifyOnWarning` | `true` | `true` / `false` | boolean | Trigger notifications when entering Warning level |
| | Notify on Critical| `notifications.notifyOnCritical`| `true` | `true` / `false` | boolean | Trigger notifications when entering Critical level |
| | Alert Log Depth | `notifications.alertLogMax` | `200` | `50` to `1000` | entries | Maximum transition events saved to `localStorage` |
| **Appearance** | Theme | `appearance.theme` | `system` | `system`, `dark`, `light`| enum | UI color theme |
| | Density | `appearance.density` | `comfortable` | `comfortable`, `compact` | enum | Padding and row height scale |
| | Large Number Mode| `appearance.largeNumberMode`| `false` | `true` / `false` | boolean | Enlarges KPI metric typography |

---

## Directory Structure

```
Joinsense/
├── mock-esp32.cjs                 # Standalone Node.js mock ESP32 server
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # TypeScript compiler options
├── vite.config.ts                 # Vite bundler configuration (host: true)
├── tailwind.config.js             # Tailwind CSS theme and custom status colors
├── index.html                     # Application HTML entry point
├── src/
│   ├── main.tsx                   # React root hydration
│   ├── App.tsx                    # App shell, navigation & React Query provider
│   ├── index.css                  # Custom scrollbars, density & base styling
│   ├── constants/
│   │   └── settings.defaults.ts   # Typed constants, defaults, and validation ranges
│   ├── types/
│   │   ├── esp32.ts               # ESP32 API status, history, commands & limits
│   │   └── settings.ts            # Settings, thresholds & alert log schemas
│   ├── utils/
│   │   ├── alert.ts               # Pure alert evaluation module
│   │   ├── alert.test.ts          # Vitest test suite for alert & slip logic
│   │   ├── settings.ts            # Settings persistence, validation & migrations
│   │   ├── settings.test.ts       # Vitest test suite for settings & IP validation
│   │   ├── sound.ts               # Web Audio API industrial chime synthesizer
│   │   └── csv.ts                 # RFC-4180 CSV export utilities
│   ├── services/
│   │   ├── api.ts                 # Fetch client for /api/status, /api/history, /api/cmd
│   │   └── simulator.ts           # Built-in conveyor dynamics hardware simulator
│   ├── hooks/
│   │   ├── useConveyorData.ts     # Main polling engine, backoff & event triggers
│   │   └── useTheme.ts            # Theme & layout density manager
│   ├── components/
│   │   ├── Header.tsx             # System branding, connection & relay status
│   │   ├── StatusBanner.tsx       # Primary alert banner, risk gauge & active conditions
│   │   ├── KpiCards.tsx           # 6 KPI cards with threshold lines and color alerts
│   │   ├── ControlsBar.tsx        # Start, Stop, Reset (with modal), Mute controls
│   │   ├── TelemetryCharts.tsx    # Recharts live waveforms with threshold lines
│   │   ├── SensorsPanel.tsx       # 6-channel diagnostic matrix and raw ADC values
│   │   ├── SpliceHistoryTable.tsx # Pass history table, joint summary & CSV export
│   │   ├── AlertLogPanel.tsx      # Chronological event log & CSV export
│   │   └── OfflineBanner.tsx      # Offline disconnection state & retry countdown
│   └── pages/
│       ├── DashboardPage.tsx      # Main conveyor operational dashboard
│       └── SettingsPage.tsx       # 2-column desktop / accordion mobile settings view
```

---

## License

MIT License. Designed and built for robust industrial conveyor monitoring.
