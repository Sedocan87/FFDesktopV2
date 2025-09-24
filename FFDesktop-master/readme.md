FreelanceFlow - Tauri Desktop App
1. Project Vision & Idea
FreelanceFlow is a comprehensive, local-first time tracking and invoicing solution designed specifically for a single freelance professional. It prioritizes user privacy, data ownership, and a clean, modern user experience.

By running as a native desktop application built with Tauri, it offers the performance and security of a traditional app without requiring any cloud accounts, subscriptions, or internet connectivity for its core features. All data is stored securely on the user's own computer, making it 100% private.

2. Core Features
The React frontend is already feature-complete. The goal of this development plan is to package it into a Tauri desktop app and replace browser-specific APIs with more robust native equivalents.

Dashboard: At-a-glance overview of key metrics, recent activity, and a running Quarterly Tax Estimate.

Client Management: Full CRUD (Create, Read, Update, Delete) for clients.

Project Management: Full CRUD for projects, including budgets, billing types (hourly/fixed), and multi-currency support.

Project Detail View: A dedicated view for each project featuring a drag-and-drop Kanban board for task management ("To Do", "In Progress", "Done"). Tasks include descriptions and are fully editable.

Time Tracking: Both a real-time stopwatch and manual entry forms.

Expense Tracking: Log project-related expenses, distinguishing between billable (client-reimbursable) and internal (business cost) expenses.

Invoicing:

Generate professional PDF invoices from unbilled time and billable expenses.

Full support for recurring invoice profiles for retainers.

Custom branding with company logo and details.

Reporting:

Time Analysis: Filterable reports on hours tracked by project and client.

Project Profitability: Detailed breakdown of revenue vs. costs (labor + expenses) to calculate true profit and margin for each project.

Settings & Data:

Customize company info, currency, tax rates, and internal costs.

Robust Backup & Restore feature to export and import all application data as a single JSON file.

3. Technical Requirements
Framework: Tauri. This is a framework for building native desktop applications using a Rust backend and a web-based frontend. It produces small, secure, and performant binaries.

Frontend: React. The provided freelanceflow.jsx contains the entire UI. It should be used as the starting point.

Language: JavaScript/JSX for the frontend, Rust for the backend (Tauri handles this).

UI Aesthetic: The app is styled to mimic the shadcn/ui design system. All components are custom-built within the React file.

Styling: Tailwind CSS.

Data Persistence: The final app will use Tauri's File System API to store all user data in a single JSON file on the user's local machine.

4. Development Plan
Phase 1: Project Setup & Integration (1-2 Days)
The goal of this phase is to get the existing React application running inside a Tauri desktop window.

Prerequisites: Ensure you have Node.js and Rust installed on your machine. Follow the Tauri prerequisites guide.

Create a New Tauri Project:
Use npm and select react with vite when prompted.

npm create tauri-app@latest freelance-flow -- --template react --manager npm

Integrate the React Code:

Navigate into the new project: cd freelance-flow.

Delete the contents of the src/ directory.

Place the provided freelanceflow.jsx file inside src/ and rename it to App.jsx.

Create a new src/index.css and add the Tailwind CSS directives:

@tailwind base;
@tailwind components;
@tailwind utilities;

Create a new src/main.jsx to render the app:

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

Install Dependencies & Configure Tailwind:

Install Tailwind CSS: npm install -D tailwindcss postcss autoprefixer

Generate config files: npx tailwindcss init -p

Configure tailwind.config.js to scan your React components:

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {},
  },
  plugins: [],
}

Run in Development Mode:
Start the application in a desktop window.

npm run tauri dev

At this point, you should have the complete application running in a native window.

Phase 2: Migrating to Tauri APIs (3-5 Days)
This phase involves replacing browser-specific code with more robust and native Tauri APIs.

Data Storage (localStorage -> Tauri fs):

The current app uses a useLocalStorage hook. This should be replaced with a more robust system that reads from and writes to a single JSON file on the user's file system.

Use the @tauri-apps/api/fs and @tauri-apps/api/path packages.

On app startup, check if freelanceflow-data.json exists in the appDataDir. If not, create it with the initial default data. If it exists, load the data into the React state.

Modify the state management so that any change to the data triggers an asynchronous writeTextFile call to save the entire state back to the JSON file.

Backup & Restore (Native Dialogs):

Refactor the "Export Data" and "Import Data" buttons in the SettingsView.

Use the @tauri-apps/api/dialog package.

For Export, use the save dialog to open a native "Save As..." window.

For Import, use the open dialog to open a native "Open File" window, restricted to .json files.

Phase 3: Polishing & Distribution (2-3 Days)
This phase prepares the application for release.

Application Icon:

Create a primary app icon (e.g., icon.png, 1024x1024).

Run the following command to generate all the necessary platform-specific icons:

npm run tauri icon /path/to/your/icon.png

Auto-Updater:

Read the Tauri Updater documentation.

Generate a public/private key pair for signing updates.

Configure the updater section in src-tauri/tauri.conf.json with your public key and the URL where update manifests will be hosted.

Build the Application:

Run the build command:

npm run tauri build

This will generate native installers (.msi for Windows, .dmg for macOS, .AppImage for Linux) in the src-tauri/target/release/bundle/ directory. These are the files you will distribute to your customers.

5. Monetization & Licensing Strategy
The application will be sold as a One-Time Purchase.

Distribution Platform: Use a service like Gumroad, Paddle, or Lemon Squeezy. These platforms are ideal for selling desktop software. They handle payment processing and can automatically generate and deliver unique license keys to customers via email.

License Key Implementation (Offline Validation):
A secure, offline validation method is required so the app doesn't need to call a server to verify a license.

Key Generation: The developer will generate a public/private key pair using a standard cryptographic library (e.g., tweetnacl-js for ED25519).

The Private Key must be kept absolutely secret. It will be used to sign licenses.

The Public Key will be embedded directly into the Tauri application's Rust or JS code.

License Generation (On Purchase):

Configure your chosen platform (e.g., Gumroad) to trigger a webhook or custom script upon a successful purchase.

This script will take the customer's email as input, use your secret private key to sign it, and generate a unique license key string. This string contains both the email and its signature.

The platform then emails this license key to the customer.

Validation Inside the Tauri App:

The user pastes their license key into the app.

The app uses the embedded public key to verify that the signature in the license key is valid for the user's email.

If valid, the app sets a "isPro" flag to true in the local data file, unlocking all pro features permanently. This validation works completely offline.

Free vs. Pro Features:

Free Version (Default):

Limited to 3 active projects.

Limited to 3 clients.

A "Powered by FreelanceFlow" watermark on all exported PDF invoices.

Pro Version (Unlocked with License Key):

Unlimited projects and clients.

Watermark is removed from invoices.