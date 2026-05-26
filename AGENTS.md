# SecureGate — Agent Context & System Instructions (AGENTS.md)

This document provides absolute ground truth, architectural intent, and core constraints for AI agents building and modifying **SecureGate** within the Google Antigravity ecosystem. Read this file completely before writing code or modifying configurations.

---

## 1. Product Identity & Core Mission
* [cite_start]**Product Name:** SecureGate [cite: 117]
* [cite_start]**Purpose:** Provide a reusable, secure authentication foundation that can be integrated into larger applications without feature creep or unnecessary complexity[cite: 124].
* [cite_start]**Scope:** Strict authentication only[cite: 120, 123]. [cite_start]SecureGate is **not** a social platform, a productivity tool, an enterprise IT directory, or a commercial product[cite: 123, 138].
* [cite_start]**Core Philosophy:** Security by default[cite: 134]. [cite_start]The experience should feel effortless for end users while enforcing uncompromising security, proper token/session lifetimes, and safe error handling behind the scenes[cite: 125, 126].

---

## 2. Target Audience & System Personas
* **End Users:** People creating accounts, signing in, and accessing protected dashboards. [cite_start]They require a quick, clear, error-free, and trustworthy process[cite: 137].
* **Builders & Teams:** Developers plugging this authentication layer into larger host applications. [cite_start]They require clean, maintainable, easily understandable, and tightly decoupled code[cite: 137].

---

## 3. Strict Scope & Boundaries (The "Out-of-Scope" Mandate)
Do **NOT** implement, suggest, or scaffold any of the following features. [cite_start]If asked to add them, politely decline citing this file[cite: 180, 181]:
* [cite_start]✘ OAuth / Social Sign-In (Google, Apple, etc.) [cite: 181]
* [cite_start]✘ Two-factor authentication (2FA / TOTP) [cite: 181]
* [cite_start]✘ Admin panels, user management grids, or membership toggles [cite: 181]
* [cite_start]✘ Payment processing or subscription billing workflows [cite: 181]
* [cite_start]✘ Usage analytics, tracking pixels, or behavior monitoring tools [cite: 181]
* [cite_start]✘ User profiles, customized avatars, bio pages, or social features [cite: 181]
* [cite_start]✘ Multi-tenant workspaces or team organizations [cite: 181]

---

## 4. Feature Specifications & Technical Requirements

### 4.1 Account Creation (Sign Up)
* [cite_start]**Fields:** Full Name, Email Address, and Password are all strictly required[cite: 143].
* [cite_start]**Validation:** Real-time form input validation with immediate, clear inline field feedback[cite: 142].
* [cite_start]**Password Strength:** Show an active indicator as the user types[cite: 144, 191, 192]:
    * [cite_start]*Weak:* Short or uses only one type of character (Red - Not acceptable)[cite: 193].
    * [cite_start]*Fair:* 8 or more characters, two types of characters (Amber - Acceptable but improvable)[cite: 193].
    * [cite_start]*Strong:* 10 or more characters, three or more types (Green - Recommended)[cite: 193].
* [cite_start]**Post-Sign-Up:** Show a confirmation screen immediately instructing them to verify via email[cite: 145, 203]. [cite_start]Fire a verification email instantly[cite: 146, 202].

### 4.2 Account Login (Sign In)
* [cite_start]**Prerequisites:** Requires a verified email address to authenticate successfully[cite: 149, 211]. [cite_start]Unverified accounts must be redirected back to a prompt to verify first[cite: 211].
* [cite_start]**Security Failures:** Show a safe, generic error message if authentication fails[cite: 150]. [cite_start]Never reveal whether the email address actually exists in the database[cite: 148].
* [cite_start]**Brute-Force Protection:** Rate-limiting is mandatory[cite: 175]. [cite_start]After exactly **5 failed attempts** from the same device/IP, temporarily lock and block further attempts[cite: 175, 231].
* [cite_start]**Logout Lifecycle:** Users can log out from any authenticated screen[cite: 152]. [cite_start]Logging out must completely destroy and invalidate the session data on the server side[cite: 153, 222]. [cite_start]Pressing the browser "Back" button must never restore access[cite: 224].

### 4.3 Email Verification
* [cite_start]**Token Expiry:** Verification links expire exactly **15 minutes** after creation[cite: 156, 231].
* [cite_start]**Single-Use:** Once clicked, the link is checked, the account is marked as verified, and the token is instantly deactivated[cite: 157, 206, 207]. [cite_start]It cannot be reused[cite: 157].
* [cite_start]**Fallback:** If an expired link is accessed, show an actionable message and a direct button to request a new verification email[cite: 158, 196, 208].
* [cite_start]**Access Barrier:** Unverified accounts are strictly barred from reaching the dashboard or any protected API endpoint[cite: 159, 169].

### 4.4 Password Recovery (Forgot Password)
* [cite_start]**Privacy-First Responses:** The interface response must be identical whether the email exists or not[cite: 162, 216]. [cite_start]Use the exact safe text: *"If an account exists for that email, a reset link has been sent."* [cite: 196]
* [cite_start]**Token Expiry:** Reset links expire exactly **1 hour** after generation[cite: 163, 231].
* [cite_start]**Single-Use:** Deactivate the reset token immediately upon its first use; it cannot be recycled[cite: 164, 218, 231].
* [cite_start]**Post-Reset:** Force a redirect to the Sign In screen to log in with the newly hashed password[cite: 219].

### 4.5 Protected Dashboard & Router Controls
* [cite_start]**Server-Side Enforcement:** Route checking must happen strictly on the server/backend engine[cite: 170]. [cite_start]It must be impossible to bypass or trick via client-side state manipulation or browser console overrides[cite: 170].
* [cite_start]**Double-Lock:** Users must be *both* successfully signed in AND marked as verified to view the dashboard[cite: 168, 169].
* [cite_start]**Validation Frequency:** Validate the session integrity on every single incoming page load or API request[cite: 171].

---

## 5. Security & Data Protection Guards

### 5.1 System Hardening Rules
* [cite_start]**Password Storage:** Passwords must *never* be stored or transmitted in readable plain-text form[cite: 129, 174]. [cite_start]They must be run through a secure modern hashing algorithm before hitting data layers[cite: 227, 231].
* [cite_start]**Headers:** Set standard secure HTTP headers natively (e.g., HSTS, X-Frame-Options, CSP, X-Content-Type-Options) to mitigate common web vectors[cite: 176, 231].
* [cite_start]**Information Leakage:** Error logs or client-facing exceptions must never reveal internal directory structure, server environment values, stack traces, or private account data[cite: 131, 177, 195].
* [cite_start]**Config Isolation:** Keep all secrets, private encryption keys, and environment variables completely out of the code repositories[cite: 178, 231]. [cite_start]Use external runtime variables instead[cite: 178].

### 5.2 Strict Data Schema Allowance
Only store what is explicitly required for authentication. [cite_start]Do not add fields outside this whitelist[cite: 226, 228]:
1.  [cite_start]**Name:** For basic UI personalization[cite: 227].
2.  [cite_start]**Email Address:** Account identifier and transactional delivery target[cite: 227].
3.  [cite_start]**Password Hash:** Secure cryptographic hash only[cite: 227].
4.  [cite_start]**Account Status:** Verification flags, creation/timestamp records[cite: 227].
5.  [cite_start]**Session Data:** Temporary server-side records validating live clients[cite: 227].

[cite_start]*Note: Never collect browsing metrics, geographical location metadata, device signatures, or user behavioral tracking logs[cite: 228].*

---

## 6. UX & Copy Protocols
[cite_start]When generating UI components or systemic error text, adhere to these exact copy mappings[cite: 196]:

| Situation / Trigger | Exact Copy UI Message to Show |
| :--- | :--- |
| **Wrong password or email** | [cite_start]`"We couldn't sign you in. Please check your details and try again."` [cite: 196] |
| **Account not found / Forgot Password** | [cite_start]`"If an account exists for that email, a reset link has been sent."` [cite: 196] |
| **Expired verification link** | [cite_start]`"This link has expired. You can request a new one below."` [cite: 196] |
| **Too many login attempts** | [cite_start]`"Too many attempts. Please wait a few minutes and try again."` [cite: 196] |
| **Something unexpected** | [cite_start]`"Something went wrong. Please try again shortly."` [cite: 196] |

* [cite_start]**Form Layout:** Labels must always be explicitly visible over input boxes[cite: 186]. [cite_start]Error messages must render *inline next to the respective field*, never collected in a bulk banner at the top[cite: 188]. [cite_start]Every form submission button must automatically switch into an active, explicit loading state[cite: 189].
* [cite_start]**Aesthetics:** Keep layouts linear, highly responsive, clear, and mobile-first[cite: 184]. [cite_start]Use honest, brief, and jargon-free language throughout the application[cite: 184, 195].

---
[cite_start]*SecureGate Construction Context • Confidential Architecture Guild • Google Antigravity Configuration [cite: 120, 232]*