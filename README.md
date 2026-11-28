# AIVARION — Private, Local-First AI Workspace
> **#BuildHybridAI Hackathon Submission**  
> Built with **Firebase AI Logic**, **Chrome Built-in Prompt API (Gemini Nano)**, **Cloud Gemini Models**, and **Cloud Firestore**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase AI Logic](https://img.shields.io/badge/Firebase-AI%20Logic%20Hybrid%20Inference-FFA000?logo=firebase)](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)
[![Chrome Built-in AI](https://img.shields.io/badge/Chrome-Prompt%20API%20%28Gemini%20Nano%29-4285F4?logo=googlechrome)](https://developer.chrome.com/docs/ai/built-in)
[![Tests](https://img.shields.io/badge/Tests-60%2F60%20Passing-brightgreen)](file:///src/test/)

---

## Executive Summary & Value Proposition

Most contemporary AI web applications compromise user privacy by transmitting every keystroke, query, and private thought to centralized cloud servers. Conversely, purely offline tools lack the depth and complex reasoning required for comprehensive planning, synthesis, and structured workflows.

**AIVARION** solves this fundamental tradeoff by implementing a **genuine hybrid AI architecture** powered by **Firebase AI Logic**:
- **Everyday AI tasks** (note management, private inquiries, skill practice) run **100% on-device** via Chrome's built-in Prompt API (Gemini Nano), ensuring zero latency, offline resilience, and zero data leakage.
- **Complex cloud reasoning** (curriculum planning, cross-domain synthesis) is routed through Firebase AI Logic using Cloud Gemini models, but **only after passing through deterministic PII redaction and dual human approval gates**.
- **No silent cloud fallbacks:** If on-device inference is unavailable or fails, AIVARION halts and requires explicit user consent before escalating to the cloud.

---

## 1. The Three AI Modes

AIVARION implements the three official inference modes specified by Firebase AI Logic:

```
+-----------------------------------------------------------------------------------+
|                                AIVARION Privacy Router                            |
+-----------------------------------------------------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
+------------------+           +-------------------+           +-------------------+
|  PRIVATE LOCAL   |           |   SMART HYBRID    |           |       CLOUD       |
+------------------+           +-------------------+           +-------------------+
| ONLY_ON_DEVICE   |           | PREFER_ON_DEVICE  |           | ONLY_IN_CLOUD     |
| Zero Cloud Calls |           | Local-First       |           | Dual Human Gates  |
| Works Offline    |           | Explicit Consent  |           | PII Redaction     |
| IndexedDB Vault  |           | Gate on Failure   |           | Cloud Gemini      |
+------------------+           +-------------------+           +-------------------+
```

### 1. Private Local Mode (`InferenceMode.ONLY_ON_DEVICE`)
- **Direct on-device execution:** Prompts and context are executed exclusively by the user's Chrome desktop browser utilizing Gemini Nano.
- **Strictly zero cloud fallback:** If the device model is unavailable or offline, the request fails gracefully with actionable diagnostic guidance. Data is never silently redirected to the cloud.
- **Offline functionality:** Functions completely offline without internet connectivity once the model component is downloaded.
- **Local persistence:** Chats, messages, and notes remain encrypted in client-side Dexie IndexedDB.

### 2. Smart Hybrid Mode (`InferenceMode.PREFER_ON_DEVICE`)
- **Local-first priority:** Queries are initially evaluated on-device for zero-latency responses.
- **Guarded fallback:** If the on-device model is unavailable or encounters a hardware constraint, AIVARION **does not silently fall back to cloud services**.
- **Human approval gate:** An interactive preview modal displays the sanitized prompt, the exact count of redacted entities, and selectable context turns. Cloud inference is executed only upon explicit user approval (`Approve & Transmit`).

### 3. Cloud Mode (`InferenceMode.ONLY_IN_CLOUD`)
- **High-capacity reasoning:** Employs Firebase AI Logic with supported cloud Gemini models (`gemini-3.5-flash-lite` and `gemini-3.8-flash`).
- **Deterministic PII redaction:** Automatically cleans personal identifiable information (emails, phone numbers, custom user entities) before any packet leaves the machine.
- **Transmission preview:** Users inspect the exact payload, uncheck any unwanted conversation context turns, and approve the transmission with a single click.

---

## 2. Technical Architecture & Firebase AI Logic Integration

AIVARION strictly follows the official [Firebase AI Logic JavaScript SDK documentation](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started).

### Core Source Code Map

| File | Purpose & Implementation Details |
|---|---|
| [`src/firebase/config.ts`](file:///src/firebase/config.ts) | Initializes Firebase App, Firebase Auth (anonymous authentication for Firestore), and Firebase AI Logic via `getAI(app, { backend: new GoogleAIBackend() })`. Configures App Check (`ReCaptchaV3Provider` / `ReCaptchaEnterpriseProvider` / debug token exchange). Bridges Chrome's Prompt API to `@firebase/ai`'s adapter. |
| [`src/services/aiService.ts`](file:///src/services/aiService.ts) | Executes `executeOnDeviceInference` (`InferenceMode.ONLY_ON_DEVICE`), `executeCloudInference` (`InferenceMode.ONLY_IN_CLOUD`), and `executeHybridInference` (`InferenceMode.PREFER_ON_DEVICE`). Inspects `result.response.inferenceSource` to display genuine `'on_device'` vs `'in_cloud'` badges. |
| [`src/services/privacyRouter.ts`](file:///src/services/privacyRouter.ts) | Enforces privacy boundaries. Blocks unauthorized cloud fallbacks and invokes the human approval gate before transmission. |
| [`src/services/sanitizer.ts`](file:///src/services/sanitizer.ts) | Deterministic client-side PII sanitizer scrub engine (emails, phone numbers, custom entities) prior to cloud egress. |
| [`src/services/studyPlanService.ts`](file:///src/services/studyPlanService.ts) | Implements Dual Approval Gates for 7-day study curricula. Gate 1 inspects the sanitized prompt; Gate 2 validates the returned Zod schema before writing tasks to Cloud Firestore (`/tasks/{taskId}`). |
| [`src/db/index.ts`](file:///src/db/index.ts) | Dexie IndexedDB local database managing conversations, messages, notes, and the offline pending cloud request queue. |

### Chrome Prompt API Bridge
Chrome's built-in AI Prompt API in native builds exposes `window.ai.languageModel` or `window.LanguageModel`, returning availability statuses such as `'readily'` or `'after-download'`. `@firebase/ai` expects specific enum strings (`'available'`, `'downloadable'`, `'downloading'`, `'unavailable'`). In [`src/firebase/config.ts`](file:///src/firebase/config.ts), AIVARION provides a transparent adapter that maps availability strings and normalizes structured content arrays into text prompts, ensuring seamless SDK interop.

---

## 3. Chrome Desktop Gemini Nano Setup Guide

To run on-device Gemini Nano inference on your local Chrome Desktop machine:

### 1. Requirements
- **Browser:** Google Chrome Desktop version 139 or newer.
- **Disk Space:** At least 22 GB free on your system drive (Chrome reserved storage for on-device models).
- **RAM:** Minimum 8 GB (16 GB recommended).
- **GPU:** Dedicated GPU or integrated GPU (see performance bypass below).

### 2. Enabling Chrome Flags
1. Open Google Chrome and enter `chrome://flags` in the address bar.
2. Search for `#prompt-api-for-gemini-nano` (or `#prompt-api`) and set it to **Enabled**.
3. Search for `#optimization-guide-on-device-model`.
   - *If your machine has less than 4 GB dedicated VRAM (e.g. integrated graphics)*, select **Enabled BypassPerfRequirement**.
   - *If your machine has 4+ GB dedicated VRAM*, select **Enabled**.
4. Click **Relaunch** at the bottom of the page.

### 3. Component Download Verification
1. Navigate to `chrome://components`.
2. Locate **Optimization Guide On Device Model**.
3. Click **Check for update**.
4. Chrome will download the Gemini Nano weights (~1.5 GB to 2.2 GB). Once the version number updates from `0.0.0.0`, the on-device engine is ready.
5. In AIVARION, the engine indicator will display **Chrome Gemini Nano (On-Device) · Ready**.

---

## 4. Judges Testing Guide

Follow these steps to independently verify every submission criterion:

### Test 1: Verify Genuine Private Local Inference & Offline Resilience
1. Navigate to `http://localhost:5173/app` in Chrome Desktop.
2. In the top-right mode selector of the Chat view, select **Private Local**.
3. Confirm the engine badge shows `ONLY_ON_DEVICE · Private Local`.
4. Enter a prompt: `"Explain the difference between mutable and immutable data structures in Python."`
5. Press Send. Notice the prompt completes with zero outbound network calls, and the response tag displays `ON-DEVICE · ONLY_ON_DEVICE`.
6. Open Chrome DevTools (`F12`) -> **Network** tab -> select **Offline** throttling.
7. Enter a second prompt: `"Give me a 3-line code example."`
8. Press Send. The on-device engine generates the response completely offline. Verify zero failed network calls.

### Test 2: Verify Smart Hybrid Mode & Approval Gate
1. Select **Smart Hybrid** mode in the Chat view.
2. If on-device AI is ready, simple queries execute locally with zero latency.
3. If on-device AI is unavailable or a cloud fallback is triggered:
   - AIVARION **blocks the request immediately**.
   - An interactive modal appears: **Cloud Fallback Approval Gate**.
   - Review the sanitized prompt preview and the selectable context turns.
   - Click **Cancel (Send Nothing)** -> Verify zero network requests are made.
   - Click **Approve & Transmit** -> Verify the request proceeds to the cloud with `PREFER_ON_DEVICE` and displays the `IN-CLOUD` badge.

### Test 3: Verify Cloud Mode & Deterministic PII Redaction
1. Select **Cloud** mode.
2. Enter a prompt containing personal details:
   `"My name is Sarah Miller, email sarah.miller@company.io, phone 415-555-0199. Create a learning plan for Rust."`
3. Press Send. Notice the **Transmission Preview Modal** opens immediately:
   - `sarah.miller@company.io` is redacted to `[EMAIL_REDACTED]`.
   - `415-555-0199` is redacted to `[PHONE_REDACTED]`.
   - Personal names are sanitized to `[REDACTED_ENTITY]`.
4. Click **Approve & Transmit**. Cloud Gemini processes only the sanitized payload and returns the structured answer.

### Test 4: Verify Study Plan Dual Approval & Firestore Storage
1. Navigate to **Study Plan** in the sidebar.
2. Enter a topic: `"Modern TypeScript Architecture"`.
3. Click **Prepare Sanitized Payload** (Gate 1). Inspect the payload and approve.
4. When the curriculum arrives, review the 7-day breakdown. Notice tasks are not yet saved to the database.
5. Click **Approve & Save to Database** (Gate 2).
6. Verify tasks are validated with Zod schemas and saved to Cloud Firestore under `/tasks/{taskId}`.

---

## 5. Setup & Local Installation

### Prerequisites
- **Node.js:** v20.x or higher
- **Package Manager:** npm v10+
- **Browser:** Google Chrome Desktop 139+

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/beenish-majeed/AIVARION.git
cd AIVARION

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)
Edit `.env.local` with your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase App Check
VITE_FIREBASE_APP_CHECK_PROVIDER=recaptcha-v3
VITE_FIREBASE_APP_CHECK_SITE_KEY=your_recaptcha_site_key
VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true
```

> **Note for Local Testing without Live Firebase:**
> AIVARION includes full offline fallback support. If `.env.local` contains placeholder keys, local on-device inference, IndexedDB notes, and skill coaching continue to work 100% offline.

### Running the Application
```bash
# Start local development server
npm run dev

# Or build and run production preview
npm run build
npm run preview
```
Open `http://localhost:5173` in Google Chrome Desktop.

---

## 6. Demo Video Script (3-Minute Maximum)

| Timecode | Visual / Screen Action | Voiceover Narration (English) |
|---|---|---|
| **0:00 - 0:25** | Landing page with dark mode, interactive 3D circular card carousel, and core value proposition. | *"Welcome to AIVARION, a private, local-first AI workspace built for the Google Cloud & Firebase #BuildHybridAI hackathon. Most AI apps send your every thought to third-party servers. AIVARION changes that by putting on-device machine intelligence first, escalating to the cloud only with your explicit permission."* |
| **0:25 - 0:55** | Navigate to `/app`. Mode selector set to **Private Local**. DevTools Network tab open showing zero network requests. | *"Here in our chat workspace, we select Private Local mode, powered by Firebase AI Logic using InferenceMode.ONLY_ON_DEVICE. When we ask complex technical questions, the response is computed directly by Chrome's built-in Gemini Nano on our computer. Watch the DevTools network tab: zero packets are transmitted. Let's even disconnect the internet entirely—the on-device model answers instantly and offline."* |
| **0:55 - 1:35** | Switch to **Smart Hybrid** mode. Prompt with sensitive inquiry triggers Cloud Fallback Approval Gate. | *"Next, we explore Smart Hybrid mode using InferenceMode.PREFER_ON_DEVICE. AIVARION tries local execution first. If local AI is unavailable or hardware constraints arise, AIVARION refuses to silently send your data to the cloud. Instead, our human approval gate appears, showing you the exact prompt, the count of redacted items, and selectable context turns. You stay in complete control."* |
| **1:35 - 2:15** | Switch to **Cloud** mode. Type input with email and phone. Transmission Preview modal demonstrates PII redaction. | *"When you choose Cloud mode for heavy reasoning, our deterministic privacy sanitizer scrubs sensitive data like names, emails, and phone numbers before transit. In the transmission preview, you inspect the exact payload that touches Google Cloud. Upon approval, Firebase AI Logic calls Cloud Gemini, verifying the result and displaying the official in-cloud inference badge."* |
| **2:15 - 2:45** | Navigate to **Study Plan** and **Notes**. Show Dual Approval Gate 2 saving validated Zod tasks to Cloud Firestore. | *"Beyond chat, AIVARION features dual approval gates for structured planning. Gate 1 inspects the study topic; Gate 2 validates the returned 7-day curriculum against strict Zod schemas before writing to Cloud Firestore. All notes and skill quizzes remain stored in private browser IndexedDB."* |
| **2:45 - 3:00** | Full test suite terminal output (60/60 tests passing), GitHub repository, closing slide. | *"With 60 automated tests, strict App Check security, and verified Firebase AI Logic hybrid inference, AIVARION delivers the future of private, user-controlled AI. Thank you."* |

---

## 7. Significant Updates Made During the Hackathon

1. **Firebase AI Logic Integration**:
   - Upgraded to latest compatible Firebase SDK (`firebase@^13.4.0`) with `@firebase/ai`.
   - Initialized `getAI(app, { backend: new GoogleAIBackend() })`.
   - Integrated `InferenceMode.ONLY_ON_DEVICE`, `InferenceMode.PREFER_ON_DEVICE`, and `InferenceMode.ONLY_IN_CLOUD`.
   - Configured `result.response.inferenceSource` tracking for verifiable UI transparency.
2. **Chrome Prompt API Bridge**:
   - Engineered a robust browser bridge in `src/firebase/config.ts` mapping native Chrome Prompt API availability strings (`'readily'`, `'after-download'`) to `@firebase/ai`'s expected enums.
   - Normalized array-formatted content structures into string prompts, resolving native Prompt API `DOMString` exceptions.
3. **Dual Human Approval Gates**:
   - Gate 1: Transmission Preview modal displaying sanitized text, redacted items, and selectable context turns before any cloud call.
   - Gate 2: Persistence Confirmation modal validating structured curricula against Zod schemas before Firestore writes.
4. **App Check & Security Hardening**:
   - Configured `initializeAppCheck` with support for `ReCaptchaV3Provider`, `ReCaptchaEnterpriseProvider`, and custom debug token exchange.
   - Verified that `.env.local` and all private credentials remain strictly git-ignored.
5. **Interactive 3D Carousel & UI Polish**:
   - Redesigned "How It Works" with a curved 3D horizontal carousel with squircle cards, perspective depth, continuous drift, and 180° hover flip.
   - Added Dark/Light mode theme toggle across all landing and application views.
6. **Comprehensive Automated Testing**:
   - Expanded test suite to **60 automated tests across 8 test suites**, achieving 100% pass rate.

---

## 8. Automated Testing & Verification

### Running the Test Suite
```bash
npm run test
```

### Verified Test Matrix (60 Tests Passed)
- `src/test/firebase-ai-hybrid.test.tsx` (12 tests): Chrome 139+ detection, single-turn context composition, `ONLY_ON_DEVICE` offline verification, `PREFER_ON_DEVICE` consent gating, download progress monitoring, and App Check diagnosis.
- `src/test/chat-modes-e2e.test.tsx` (11 tests): UI mode switches, non-dead-end unavailable banner, context turn selection, SDK inference source badges, and real error classification.
- `src/test/e2e-security.test.tsx` (10 tests): End-to-end security invariants, offline queueing, and Firestore security rules contract.
- `src/test/quiz-privacy.test.tsx` (9 tests): Zod schema validation, deterministic code grading, PII sanitizer regex, and offline notes.
- `src/test/plan-firestore.test.tsx` (5 tests): Gate 1 sanitization, 7-day curriculum validation, Gate 2 task creation, and offline pending requests.
- `src/test/landing.test.tsx` (5 tests): 4-step privacy sequence, 3D carousel hover flip, drag gestures, reduced motion, and navigation.
- `src/test/chat-db.test.tsx` (5 tests): Dexie IndexedDB CRUD, conversation management, and local privacy.
- `src/test/brand.test.tsx` (3 tests): Brand identity tokens, logo assets, and application navigation.

### Production Build Verification
```bash
npm run build
```
Generates a production build in `dist/` with PWA service worker caching (`dist/sw.js`) and split vendor chunks.

---

## 9. Security & Privacy Audit Certification

- [x] **Zero Private Prompts to Cloud**: Private Local mode uses strictly `InferenceMode.ONLY_ON_DEVICE` with zero cloud fallback.
- [x] **No Committed Secrets**: No API keys, App Check debug tokens, or `.env.local` files are tracked in git.
- [x] **Verified Content Security Policy**: Configured in `index.html` allowing only approved Google/Firebase origins.
- [x] **Firestore Security Rules**: Protected `/tasks/{taskId}` collection restricted to authenticated owners (`firestore.rules`).
- [x] **Open Source License**: Released under the permissive **MIT License**.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).  
Copyright (c) 2026 beenish-majeed.
