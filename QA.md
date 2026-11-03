# Verification

Verified locally on 4 November 2026.

## Purple reference redesign

- Home, subject controls, request review, student list, manual rolls, present card, history and profile screens implemented in the supplied reference's purple style.
- Opened Discrete Mathematics from the subject toggle, submitted a student request, switched to CR, and approved that request.
- Closed that subject's attendance window.
- Bulk entered rolls 2301001, 2301002 and 2301004; confirmed 3 present and 9 absent.
- Downloaded `present-CSE-203-2026-11-04.pdf` successfully from the present card.
- PDF library loads on demand rather than in the initial app bundle.
- Mobile screenshots saved alongside the source.

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

Known scope: one classroom, nine courses and labs from the supplied college routine, and institution-managed roll assignments. No automated roll uniqueness check or multi-classroom enrollment flow. Vite reports a large JavaScript bundle warning because the Firebase client is included; the build succeeds.

## College routine update

- Four automated routine tests pass (npm test).
- Replaced placeholder subjects with CSE-2201 through CSE-2205, CSE-2211, CSE-2212, CSE-2213 and CSE-2216.
- Real teacher names appear in subjects, weekly routine, attendance metadata, PDF present cards and CSV exports.
- Firebase rules updated for the nine real course IDs; live Firebase deployment still requires project configuration.
