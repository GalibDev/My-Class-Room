# Verification

Verified locally on 4 November 2026.

- Production build: `npm run build` passes.
- Production dependency audit: `npm audit --omit=dev` reports zero vulnerabilities.
- Student requests: opening the Data Structures window enables its request button; submitting creates a pending request in the CR register.
- Approval: CR marks the pending student present; the student profile shows Present and disables repeat requests.
- Closure: after closing a subject window, the student request control is disabled.
- Roll marking: entering roll 2301010 updates that student's attendance to present.
- Persistence: approval and roll attendance remain after reloading the page.
- Subject isolation: other subjects remain unmarked and their request windows stay independent.
- Date isolation: moving to the next day shows unmarked records instead of today's attendance.
- Export: browser downloads a CSV; inspected file contains date, subject, roll, name and status headers and correct student data.
- Mobile: tested at a 390 × 844 viewport; document width equals viewport content width with no page overflow. Preview is in `screenshots/mobile-attendance.jpg`.

Firebase Authentication, Firestore subscriptions and deployed security rules have not been exercised against a live project because no project configuration was supplied. The app currently opens in demo mode. Run the Firebase setup in README before using real attendance records.

Known scope: one classroom, three predefined subjects, and institution-managed roll assignments. No automated roll uniqueness check or multi-classroom enrollment flow. Vite reports a large JavaScript bundle warning because the Firebase client is included; the build succeeds.
