# AIVARION

A private, local-first AI workspace and immersive landing page. AIVARION combines on-device machine intelligence, deterministic skill coaching, local encrypted notes, and guarded cloud inference protected by dual human approval gates.

---

## 1. Architectural Overview

AIVARION is engineered on a strict **local-first** paradigm. User data, chats, personal notes, and skill quiz attempts remain on your physical device by default.

```
+-------------------------------------------------------------------------+
|                               AIVARION App                              |
+-------------------------------------------------------------------------+
                                     |
                                     v
                       +---------------------------+
                       |    Mode Privacy Router    |
                       +---------------------------+
                                     |
        +----------------------------+---------------------------+
        |                            |                           |
        v                            v                           v
 [Private Local]              [Hybrid Auto]               [Cloud Guarded]
 100% On-Device               Local-First Attempt         Cloud Planning
  - Chrome Prompt API          - Tries On-Device           - Gate 1: Sanitizer
  - Gemini Nano                - If unavailable:             Preview Modal
  - Dexie IndexedDB              Approval Gate 1           - User Approval
  - Zero Cloud Calls             before Cloud              - Cloud Inference
                                                           - Gate 2: Approval
                                                           - Firestore Write
```

### Core Architecture Components
1. **On-Device Inference Engine (`window.ai` / Chrome Prompt API / Gemini Nano):** Operates without an internet connection and zero telemetry.
2. **IndexedDB Local Storage (Dexie v4):** High-performance client-side storage for conversations, messages, notes, quiz attempts, pending requests, and user preferences.
3. **Deterministic Privacy Sanitizer:** Regex-driven redaction for emails, phone numbers, custom user entities, and sensitive keyword analysis before any outbound transmission.
4. **Dual Human Approval Gates:**
   - **Gate 1 (Transmission Preview):** Inspects raw vs sanitized payload before cloud transmission. User must click "Approve & Transmit".
   - **Gate 2 (Persistence Confirmation):** Validates returned study plan with Zod schemas. Tasks are saved to Cloud Firestore only after the user explicitly clicks "Approve & Save".
5. **Offline Queue & Manual Sync:** Network failures or offline requests are queued in local IndexedDB. AIVARION **never auto-transmits** on reconnect; requests must be reviewed and synced manually.

---

## 2. Exact File Paths for Firebase AI Logic

Cloud and hybrid inference integration points are isolated to:

- `src/services/aiService.ts`:
  - `checkDeviceModelAvailability()`: Probes hardware capabilities via Chrome Prompt API (`window.ai.languageModel.capabilities`) or Firebase AI Logic `InferenceMode.ONLY_ON_DEVICE`.
  - `executeOnDeviceInference()`: Runs on-device inference using `ONLY_ON_DEVICE`.
  - `executeCloudInference()`: Runs cloud inference using `ONLY_IN_CLOUD`.
  - Reads `result.response.inferenceSource` (`'on_device'` vs `'in_cloud'`) to display transparent badges in the UI.
- `src/services/privacyRouter.ts`:
  - Enforces mode boundaries. In `private_local` mode, throws immediately if local inference is absent, prohibiting silent cloud routing.
- `src/services/studyPlanService.ts`:
  - `prepareStudyPlanPayload()`: Scrubs PII prior to Gate 1.
  - `executeCloudStudyPlan()`: Transmits sanitized payload to cloud, parses JSON, and validates structure with `StudyPlanSchema`.
  - `saveApprovedTasksToFirestore()`: Persists tasks to `/tasks/{taskId}` collection upon Gate 2 approval.

---

## 3. Brand & Design Tokens

AIVARION uses a minimal, high-contrast dark aesthetic:
- **Jet Black (`#0B0B0B`):** Primary base background for zero distraction.
- **Hot Pink (`#FF2DA8`):** Main interactive accent for buttons, active tabs, and 3D orbits.
- **Chartreuse (`#D4FF3F`):** Sparingly applied for single status dots and schema validation badges.
- **Surface Neutrals (`#141416`, `#18181B`, `#27272A`):** WCAG AA compliant contrast for cards and text.

---

## 4. Setup & Local Development

### Prerequisites
- **Node.js:** v20.x or higher
- **Browser:** Google Chrome Desktop 139+ recommended for native Chrome Prompt API (`window.ai`) and Gemini Nano hardware acceleration.

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd AIVARION

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your Firebase credentials in `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# App Check
VITE_FIREBASE_APP_CHECK_PROVIDER=recaptcha-v3
VITE_FIREBASE_APP_CHECK_SITE_KEY=your_recaptcha_site_key
VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true
```

> **Note on Local Development without Firebase:**
> If `.env.local` contains mock or empty keys, AIVARION gracefully runs in mock/test mode. All local features (Notes, Chat with on-device model, Skill Coach) function offline, and cloud study planning produces a deterministic verified mock plan.

### Running Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 5. Security & App Check

### Cloud Firestore Security Rules
Located at `firestore.rules`:
- Restricts `/tasks/{taskId}` access strictly to authenticated owners (`request.auth.uid == resource.data.userId`).
- Validates required fields: `userId`, `title`, `status`, `createdAt`, `approvedAt`.
- Enforces strict key whitelist (`hasOnly`) to block unexpected fields.
- Denies all other collections by default.

To deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### App Check Configuration
App Check defends your backend against abuse:
- In production, configure `VITE_FIREBASE_APP_CHECK_PROVIDER` (`recaptcha-v3` or `enterprise`) and your site key.
- In local development, `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=true` generates a debug token in the DevTools console, which can be whitelisted in the Firebase Console.

---

## 6. How to Test Offline Mode

1. Start the app: `npm run dev` and open `http://localhost:5173/app`.
2. Open Chrome DevTools (`F12`) -> **Network** tab.
3. In the throttling dropdown, select **Offline**.
4. Test offline capabilities:
   - **Notes:** Create, edit, search, and delete personal notes. Everything is stored in local IndexedDB.
   - **Skill Coach:** Complete Python practice questions. Grading is executed entirely by deterministic client-side evaluation.
   - **Offline Cloud Planning Queue:** Go to **Study Plan**, enter a topic, and click "Prepare Sanitized Payload". Approve Gate 1. Notice the app alerts that the device is offline and queues the item under **Offline Pending Cloud Requests**.
5. Switch the DevTools network back to **No throttling** (Online).
6. Verify that AIVARION **does not auto-transmit** the queued request.
7. Click **Review & Sync** on the pending request card, review the sanitized payload modal, and confirm transmission.

---

## 7. Automated Testing & Production Build

### Running Test Suite
Execute the Vitest test suite:
```bash
npm run test
```
**Test Coverage:**
- `src/test/brand.test.tsx`: Brand identity, logo assets, navigation routes.
- `src/test/landing.test.tsx`: 4-step privacy sequence, 3D WebGL fallbacks, mobile layout.
- `src/test/chat-db.test.tsx`: Dexie IndexedDB CRUD, single-turn context formatting, private local enforcement.
- `src/test/quiz-privacy.test.tsx`: Zod schemas, deterministic code grading, PII sanitizer regex, offline notes.
- `src/test/plan-firestore.test.tsx`: Gate 1 sanitization, 7-day curriculum validation, Gate 2 task creation, offline pending requests.
- `src/test/e2e-security.test.tsx`: End-to-end security invariants, offline queueing, Firestore rules contract.

### Production Build
```bash
npm run build
```
Generates an optimized production bundle in `/dist` with isolated 3D WebGL chunks and service worker caching.
