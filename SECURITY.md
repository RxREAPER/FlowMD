# Security Policy

## Supported versions

The live site (`https://flowmd-04.web.app`) always runs the latest version from `main`. Only the latest release is supported.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Email the maintainer privately (or open a private vulnerability report via GitHub's **Security → Report a vulnerability** if available on this repo).

When reporting, include:

- The affected endpoint/feature and how to reproduce it.
- Impact (data exposure, XSS, privilege escalation, etc.).
- Suggested fix if you have one.

You should receive a response within a few days. Please do not disclose the issue publicly until it has been addressed.

## What is intentionally public

- **Firebase API key** (`firebase.js`). Client SDK keys must ship with every client and cannot be secret. **Access control is enforced by `firestore.rules`**, not by the key. Treat the rules file as the security boundary.
- **The syllabus dataset** (subjects/chapters/video titles). This is educational course metadata used under Marrow's terms; it is not sensitive data.

## Defenses in place

- **Firestore rules** (`firestore.rules`): every read/write requires authentication and ownership of the user's own doc; field types and sizes are capped; oversized or malformed payloads are rejected.
- **Strict CSP** served via Firebase Hosting headers (`object-src 'none'`, no `unsafe-eval`); inline event handlers are forbidden in `index.html`.
- **XSS hardening**: all user input (`doctorName`, search `q`, sync email, toast text) is escaped before rendering.
- **Client-side sanitization**: any unknown/malformed cloud fields are stripped on read before they can touch app state.

## Rules changes

`firestore.rules` is versioned in this repo and validated against the Firestore emulator (`npm run test:rules`) before every deploy. A rules change without that suite passing is a release blocker.
