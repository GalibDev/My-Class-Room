# My Class Room

A mobile-first attendance workspace for a class representative and students. Built with React, Vite, Firebase Authentication and Cloud Firestore.

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

| Collection | Document ID | Contents |
| --- | --- | --- |
| users | Auth UID | name, roll, role |
| sessions | subject_YYYY-MM-DD | subject, date, open |
| attendance | subject_YYYY-MM-DD_UID | studentId, subject, date, status |

Subject definitions and classroom branding live in `src/main.jsx`. Date defaults to Asia/Dhaka. A closed request window rejects student writes at the database rules layer. Students can only request for themselves and cannot overwrite an approved present record. CRs approve or decline independently of the request window.

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
