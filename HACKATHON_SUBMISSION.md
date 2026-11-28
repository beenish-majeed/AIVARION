# AIVARION — #BuildHybridAI Hackathon Submission Dossier

**Project Name**: AIVARION  
**Submission Category**: Google Cloud & Firebase #BuildHybridAI Hackathon  
**Target Platform**: Google Chrome Desktop (version 139+) & Modern Web  
**Primary Technologies**: Firebase AI Logic (`@firebase/ai`), Google Chrome Built-in Prompt API (Gemini Nano), Cloud Gemini Models, Cloud Firestore, Firebase App Check, Dexie IndexedDB.  
**Open Source License**: [MIT License](file:///LICENSE)

---

## 1. Project Description & Value Proposition

AIVARION is a **private, local-first AI workspace** that resolves the core tension of modern AI: the privacy hazards of cloud surveillance versus the reasoning limitations of purely local models.

Using **Firebase AI Logic**, AIVARION introduces a three-tier architecture:
1. **Private Local Mode (`InferenceMode.ONLY_ON_DEVICE`)**: Operates 100% on the user's Chrome browser using on-device Gemini Nano. Zero packets leave the device. Fully operational offline after model download.
2. **Smart Hybrid Mode (`InferenceMode.PREFER_ON_DEVICE`)**: Evaluates queries on-device first. If the local model is unavailable or constrained, it halts and requires explicit user consent via an interactive human approval gate before escalating to the cloud.
3. **Cloud Mode (`InferenceMode.ONLY_IN_CLOUD`)**: Connects to Cloud Gemini via Firebase AI Logic for heavy reasoning tasks, protected by automatic PII redaction and an upfront payload preview.

---

## 2. Technical Architecture & File Map

| Component | File Path | Implementation Details |
|---|---|---|
| **Firebase AI Logic Initialization** | [`src/firebase/config.ts`](file:///src/firebase/config.ts) | `getAI(app, { backend: new GoogleAIBackend() })`, `initializeAppCheck`, and Chrome Prompt API adapter bridge. |
| **Hybrid Inference Services** | [`src/services/aiService.ts`](file:///src/services/aiService.ts) | `executeOnDeviceInference` (`ONLY_ON_DEVICE`), `executeHybridInference` (`PREFER_ON_DEVICE`), and `executeCloudInference` (`ONLY_IN_CLOUD`). Reads `result.response.inferenceSource`. |
| **Privacy Router** | [`src/services/privacyRouter.ts`](file:///src/services/privacyRouter.ts) | Enforces mode boundaries. Halts requests without consent and prevents silent cloud fallback. |
| **PII Redaction Engine** | [`src/services/sanitizer.ts`](file:///src/services/sanitizer.ts) | Deterministic regex scrubber for emails, phone numbers, and custom sensitive entities before cloud transmission. |
| **Dual Approval Gates** | [`src/services/studyPlanService.ts`](file:///src/services/studyPlanService.ts) | Gate 1 (Transmission Preview) & Gate 2 (Persistence Confirmation) for structured curricula. Writes validated Zod tasks to `/tasks/{taskId}` in Cloud Firestore. |
| **Local Storage Vault** | [`src/db/index.ts`](file:///src/db/index.ts) | Dexie IndexedDB for conversations, messages, notes, and offline pending requests. |

---

## 3. Chrome Gemini Nano Hardware & Configuration Guide

To enable on-device inference with Gemini Nano in Google Chrome Desktop:

1. **System Requirements**: Chrome Desktop version 139+, 22+ GB free disk space on system drive, 8+ GB RAM.
2. **Chrome Flags**:
   - `chrome://flags/#prompt-api-for-gemini-nano` -> **Enabled**
   - `chrome://flags/#optimization-guide-on-device-model` -> **Enabled BypassPerfRequirement** (required for integrated GPUs with <4 GB VRAM; **Enabled** for 4+ GB dedicated GPUs).
3. **Relaunch**: Click Relaunch at the bottom of `chrome://flags`.
4. **Model Download**: Navigate to `chrome://components` -> find **Optimization Guide On Device Model** -> click **Check for update**.
5. **App Status**: In AIVARION, the engine status in the sidebar will update to **Chrome Gemini Nano (On-Device) · Ready**.

---

## 4. Judges Testing Checklist

### Test A: Private Local & Offline Verification
- [x] In Chat view, select **Private Local** mode.
- [x] Submit a prompt: `"Explain binary search complexity."`
- [x] Verify DevTools Network tab shows 0 outbound requests.
- [x] Verify response has badge: `ON-DEVICE · ONLY_ON_DEVICE`.
- [x] Set DevTools Network to **Offline**.
- [x] Submit another prompt -> verify it completes successfully offline.

### Test B: Smart Hybrid Mode & Approval Gate
- [x] Select **Smart Hybrid** mode.
- [x] If local model is unavailable or encounters failure, verify the **Cloud Fallback Approval Gate** opens.
- [x] Verify user must explicitly click **Approve & Transmit** before any network packet is dispatched.
- [x] Verify clicking **Cancel (Send Nothing)** aborts with zero data sent.

### Test C: Cloud Mode & PII Redaction
- [x] Select **Cloud** mode.
- [x] Enter text with email and phone number.
- [x] Verify the **Transmission Preview Modal** opens, showing redacted count and mapping.
- [x] Verify selectable context turns allow including/excluding prior messages.
- [x] Approve -> verify Firebase AI Logic cloud inference executes and displays `IN-CLOUD` badge.

### Test D: Study Plan Dual Gates & Firestore
- [x] Navigate to **Study Plan**.
- [x] Gate 1: Inspect topic payload and approve transmission.
- [x] Gate 2: Review returned 7-day curriculum and approve write to Cloud Firestore.

---

## 5. 3-Minute Demo Video Script

- **0:00 - 0:25**: Introduction to AIVARION, problem statement (privacy vs intelligence), and landing page overview.
- **0:25 - 0:55**: Private Local mode demo (`InferenceMode.ONLY_ON_DEVICE`), DevTools network monitoring showing zero requests, offline execution with network disconnected.
- **0:55 - 1:35**: Smart Hybrid mode demo (`InferenceMode.PREFER_ON_DEVICE`), on-device first, fallback blocking, and human approval gate inspection.
- **1:35 - 2:15**: Cloud mode demo (`InferenceMode.ONLY_IN_CLOUD`), deterministic PII sanitizer scrubbing emails/phone numbers, payload preview modal, and cloud execution badge.
- **2:15 - 2:45**: Structured planning with Dual Approval Gates, Zod schema validation, and Cloud Firestore storage. Local notes in IndexedDB.
- **2:45 - 3:00**: Testing matrix (60/60 automated tests passing), security audit certification, and open-source availability.

---

## 6. Security & Privacy Audit Summary

- **Secrets Audit**: Clean. No API keys, App Check tokens, or `.env.local` files are tracked in git.
- **Content Security Policy**: Clean. Restricted to Google/Firebase authorized domains.
- **Firestore Security Rules**: Clean. Enforces owner-only read/write on `/tasks/{taskId}`.
- **Automated Tests**: 60 of 60 tests passing across 8 test suites (`npm run test`).
- **Production Build**: Clean. Succeeded with zero type errors (`npm run build`).
