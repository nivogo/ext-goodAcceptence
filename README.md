# Nivogo Ext-GoodAcceptance

**Nivogo Ext-GoodAcceptance** is an internal QR code scanning and shipment management application developed for **Nivogo**, designed to streamline the pre-acceptance (`onKabul`) and goods acceptance (`malKabul`) processes for store-based shipments. This project facilitates tracking, reporting, and user notifications within a company-specific workflow, leveraging a modern web stack with React, Next.js, and a RESTful API integration.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Directory Structure](#directory-structure)
- [License](#license)

---

## Project Overview

This application is tailored for Nivogo's internal logistics team to manage shipment workflows efficiently. It supports QR code-based tracking, pre-acceptance validation, goods acceptance confirmation, address management, and comprehensive reporting. The system ensures a user-friendly experience with features like persistent input focus for handheld terminals and real-time notifications.

The project is built as a single-page application (SPA) using Next.js, with server-side rendering (SSR) capabilities for SEO and performance optimization. It integrates with a REST API (`https://accept.hayatadondur.com/acceptance/index.php`) for data persistence and retrieval.

---

## Features

1. **User Authentication (`AuthContext`)**
   - Secure login with username/password via Basic Authentication.
   - Persistent session management using `localStorage` with a 7-day expiration.
   - User data includes `name`, `storeName`, `paad_id`, and `username`.

2. **Pre-Acceptance (`onKabul`)**
   - Scans shipment boxes (starting with "BX" or "TR") to validate against the user's `paad_id`.
   - Marks shipments as "Okutma Başarılı" (`on_kabul_durumu: 1`), "Fazla Koli" (`2`), or "Sistem Dışı Koli" (`3`).

3. **Goods Acceptance (`malKabul`)**
   - Lists boxes with `on_kabul_durumu` "1" or "2" and `box_closed` as `false`.
   - Scans QR codes (starting with "NVG") to update `mal_kabul_durumu` (1, 2, 3, or 4).
   - Supports closing boxes with a confirmation popup, setting `box_closed: true`.

4. **Successful Boxes (`basariliKoliler`)**
   - Displays a list of shipments with `on_kabul_durumu` "1" or "2".
   - Shows status as "Okutma Başarılı", "Okutma Başarılı (Fazla Koli)", or "Okutma Başarılı (Sistem Dışı Koli)".

5. **Address Management (`adresleme`)**
   - Allows toggling shipment addresses between "Reyon" and "Depo".
   - Requires pre-acceptance and goods acceptance completion.

6. **Reporting (`rapor`)**
   - Lists all shipments for the user's `paad_id` with searchable fields.
   - Exports data to Excel using the `xlsx` library.

7. **Notification System (`NotificationContext`)**
   - Displays toast notifications for success, warnings, and errors with a 3-second timeout.

8. **Terminal-Friendly Input (`FocusLockInput`)**
   - Ensures persistent cursor focus and optional keyboard control for handheld devices.

---

## Technology Stack

- **Frontend**: 
  - React 18.2.0
  - Next.js 13.4.12 (SSR and static site generation)
- **State Management**: Custom React Context (`AuthContext`, `NotificationContext`)
- **API Integration**: RESTful API with Basic Authentication
- **Styling**: CSS Modules with global resets (`globals.css`)
- **Excel Export**: `xlsx` 0.18.5
- **Dependencies**: 
  - Firebase 9.23.0 (for initial auth prototype, not fully utilized)
- **Dev Tools**: ESLint 8.43.0 with Next.js config

---

## Architecture

The application follows a modular architecture:

- **Pages**: Next.js pages (`/pages`) handle routing and rendering.
- **Components**: Reusable UI elements (`BackButton`, `FocusLockInput`, `Notification`).
- **Context**: Global state management for authentication and notifications.
- **Lib**: API interaction utilities (`auth.js`, `firestore.js`).
- **Styles**: Scoped CSS modules for each page/component.

Data flows from the REST API to the frontend via `fetch` calls in `firestore.js`, with Basic Authentication headers managed through `localStorage`.

---

## Prerequisites

- **Node.js**: v16.x or higher (tested with v18.x).
- **Git**: For version control and cloning the repository.
- **GitLab Account**: To access or push to the repository.
- **Terminal**: Command-line interface (e.g., Bash, PowerShell).

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://gitlab.com/your-username/nivogo-ext-goodacceptence.git
   cd nivogo-ext-goodacceptence

   ```bash
   npm install

    ```bash
    npm run dev

The app should run locally at http://localhost:3000.

---

## Configuration

Environment Variables
The project uses Vercel environment variables for secrets. For local development, create a .env.local file in the root directory:

NEXT_PUBLIC_API_BASE=https://accept.hayatadondur.com/acceptance/index.php

NEXT_PUBLIC_API_BASE: The REST API endpoint (already hardcoded in firestore.js, but can be externalized).
Authentication
The app uses Basic Authentication. Credentials are stored in localStorage as basicAuth after login.
Ensure the API supports PUT requests with id: -1 and paad_id: -1 for session refresh.

Usage

```bash
npm run dev

Open http://localhost:3000 in your browser.
Login:
Navigate to / and enter your username/password.
Successful login redirects to /mainPage.
Main Features:
Pre-Acceptance: Go to /onKabul, scan a box code (e.g., "BX123").
Goods Acceptance: Go to /malKabul, select a box, then scan QR codes in /malKabulDetay.
Close Box: In /malKabulDetay, click "Koli Kapat" and confirm via popup.
Successful Boxes: View at /basariliKoliler.
Address Management: Toggle addresses at /adresleme.
Reporting: Export shipment data at /rapor.
Logout:
Click "Çıkış Yap" on /mainPage to clear session data.

API Integration
The app integrates with a REST API at https://accept.hayatadondur.com/acceptance/index.php. Key endpoints:

GET: Fetch shipments by paad_id, box, qr, or adres.
PUT: Update shipment fields (e.g., mal_kabul_durumu, box_closed).
POST: Add new shipments for missing boxes or QR codes.
Authentication
Uses Basic Auth with username:password encoded in Base64, stored as basicAuth in localStorage.
Each request precedes with a refresh call (refreshAuthorization).
Example Payloads
Update Goods Acceptance:

```bash
{
  "where": { "id": "123" },
  "data": {
    "mal_kabul_durumu": "1",
    "mal_kabul_yapan_kisi": "user",
    "mal_kabul_saati": "2025-02-25T12:00:00Z",
    "accept_wh_id": "456",
    "accept_datetime": "2025-02-25T12:00:00Z",
    "adres": "REYON",
    "adresleme_yapan_kisi": "user",
    "adresleme_saati": "2025-02-25T12:00:00Z"
  }
}

Deployment
The project is deployed on Vercel:

Push to GitLab:

```bash
git push origin main

Vercel Setup:
Link your GitLab repository in Vercel Dashboard.
Set environment variables (e.g., NEXT_PUBLIC_API_BASE) in Vercel project settings.
Deploy with npm run build and npm start.
Build Configuration:
next.config.js rewrites /api/* to the external API endpoint (http://37.75.12.56/acceptance/index.php).
Environment Variables

Variable Description Example Value
NEXT_PUBLIC_API_BASE REST API base URL (optional)  https://accept.hayatadondur.com/acceptance/index.php
For local development, add these to .env.local. For production, configure in Vercel.

Directory Structure

nivogo-ext-goodacceptence/
├── README.md                # Project documentation
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
├── components/              # Reusable UI components
│   ├── BackButton.js
│   ├── FocusLockInput.js
│   └── Notification.js
├── context/                 # React Context for state management
│   ├── AuthContext.js
│   └── NotificationContext.js
├── lib/                     # Utility functions
│   ├── auth.js             # Authentication logic
│   └── firestore.js        # API interaction logic
├── pages/                   # Next.js pages
│   ├── 404.js
│   ├── _app.js
│   ├── adresleme.js
│   ├── basariliKoliler.js
│   ├── index.js
│   ├── mainPage.js
│   ├── malKabul.js
│   ├── malKabulDetay.js
│   ├── onKabul.js
│   └── rapor.js
└── styles/                  # CSS modules and global styles
    ├── Adresleme.module.css
    ├── BasariliKoliler.module.css
    ├── MainPage.module.css
    ├── MalKabul.module.css
    ├── MalKabulDetay.module.css
    ├── Notification.module.css
    ├── OnKabul.module.css
    ├── Rapor.module.css
    └── globals.css

License
This project is proprietary and intended for internal use by Nivogo. Unauthorized distribution or modification is prohibited.
