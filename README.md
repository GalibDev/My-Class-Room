# My Class Room

## Installable PWA

- Standalone web app manifest, purple graduation-cap icons (192/512px), a maskable icon and an Apple touch icon.
- Profile includes Install App when the browser offers installation, with Safari/browser-menu instructions otherwise.
- The production service worker precaches the app shell, routine, icons and all JavaScript/CSS chunks, including the PDF exporter. External fonts can fall back to system fonts offline.
- New builds display an Update prompt; updates do not force a reload during attendance entry.
- Offline status is displayed. Real Firebase attendance writes and request-window changes require a connection. Firebase responses are not cached by the service worker; this does not add offline authentication or shared attendance synchronization.
- Demo records remain local to this browser/device.

Test the production PWA locally:

```sh
npm run check:pwa
npm run preview
```

The service worker is intentionally disabled in `npm run dev`. Install on a phone after deploying the production build to HTTPS hosting. Android: Chrome menu → Install app / Add to Home screen. iPhone: Safari → Share → Add to Home Screen. Localhost installation is for testing on the same computer; the localhost URL on your phone does not point to this PC.

Run `npm run icons` to regenerate PNG icons from `public/favicon.svg`. Firebase Hosting includes no-cache headers for the worker and manifest so deployed updates can be discovered.

A mobile-first attendance workspace for a class representative and students. Built with React, Vite, Firebase Authentication and Cloud Firestore. The purple mobile interface follows the supplied design reference with gradient controls, rounded cards, subject toggles and Home / Subjects / History / Profile navigation.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Without Firebase configuration the app runs in an explicitly labelled interactive demo. Demo records persist in this browser only. Use the CR / Student selector to try both experiences.

## Features

- CR attendance register by subject and date, searchable by name or roll.
- Mark present or absent directly from the list or mark present by roll.
- Open or close student requests independently for each subject and date.
- Review pending requests and approve using Present, or decline using Absent.
- Student profile with subject-wise attendance and date selection.
- CSV download with date, subject, name, roll and attendance status.
- Present Card with downloadable PDF and print layout.
- Bulk roll entry: comma, space or newline separated rolls mark those students present and the remaining students absent. Unknown rolls are rejected before saving.
- Student selection for bulk present marking; direct status buttons save immediately.
- Responsive navigation, mobile layouts, accessible controls and persistent demo data.
- Real accounts, realtime Firestore subscriptions and server-enforced role permissions when Firebase is configured.

## Connect Firebase

1. Create a Firebase project and register a Web app.
2. Enable Authentication → Email/Password.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env.local` and fill in the Web app configuration from Firebase project settings. Restart Vite after changing environment variables.
5. Deploy `firestore.rules` before using real accounts. With Firebase CLI installed and authenticated:

```sh
firebase use --add
firebase deploy --only firestore:rules
```

6. Register your student accounts through the app. For the CR account, register first, then use the trusted Firebase Console to change that account's `users/{uid}.role` to `cr`. Clients cannot assign or change roles. Do not relax the rules to bootstrap the CR.
7. The CR sees all registered students. Student names and rolls form the classroom directory. This version serves one classroom per Firebase project; use a separate project per classroom. Rolls should be assigned by your institution; uniqueness is not enforced in this version.

Firebase data paths:

| Collection | Document ID            | Contents                         |
| ---------- | ---------------------- | -------------------------------- |
| users      | Auth UID               | name, roll, role                 |
| sessions   | subject_YYYY-MM-DD     | subject, date, open              |
| attendance | subject_YYYY-MM-DD_UID | studentId, subject, date, status |

Subjects, instructors and the exact Sunday–Thursday schedule live in `src/routine.js`; screen components live in `src/Classroom.jsx` and `src/RoutineView.jsx`. Date defaults to Asia/Dhaka. A closed request window rejects student writes at the database rules layer. Students can only request for themselves and cannot overwrite an approved present record. CRs approve or decline independently of the request window.

## Production build and hosting

```sh
npm run build
npm run preview
```

`dist/` is the production output. Firebase Hosting configuration is included:

```sh
firebase deploy --only hosting,firestore:rules
```

Set Firebase environment variables at build time. This repository does not include Firebase credentials or deploy a database automatically. Production Auth and Rules must be validated against your own project before real student use. Google Fonts is optional; local sans-serif fallbacks are included.

## Verification

Production build and dependency audit are run during implementation. Browser QA covers request submission, CR approval, request closure, roll marking, subject isolation and persistence. Live Firebase behavior requires a configured Firebase project; no claim of live database testing is made without one.

Security rules reference: https://firebase.google.com/docs/firestore/security/rules-conditions

## Supplied college routine

Shyamoli Textile Engineering College, CSE 4th semester (2nd year, 2nd semester), 2026. Includes nine courses and labs, all assigned instructors, double-period labs, the 9:40–10:10 AM break, extracurricular periods and the source faculty key. The source’s fifth-period start says 11:50 PM; the app interprets it as 11:50 AM in this morning timetable. Friday and Saturday have no classes. Unscheduled subjects remain available for makeup attendance, clearly labelled as not scheduled.

Run npm test to verify period coverage, lab spans, weekend behavior and instructor mappings. Deploy the updated firestore.rules to authorize the new course IDs. Older demo course records are retained separately and are not relabelled as the real courses.
