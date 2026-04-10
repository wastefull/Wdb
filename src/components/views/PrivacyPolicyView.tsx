import React from "react";
import { PageTemplate } from "../shared/PageTemplate";

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export function PrivacyPolicyView({ onBack }: PrivacyPolicyViewProps) {
  return (
    <PageTemplate
      title="Privacy Policy"
      description="Last updated: April 10, 2026"
      onBack={onBack}
      backButtonLabel="Legal"
      maxWidth="3xl"
    >
      <div className="space-y-8 text-[14px] leading-relaxed text-black/80 dark:text-white/80">
        <p>
          This policy explains what personally identifiable information (PII)
          WasteDB receives through Supabase authentication and Google OAuth, and
          how your sign-in session and browser storage are used.
        </p>

        {/* Scope */}
        <section className="space-y-3">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Scope
          </h2>
          <p>This document covers:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>WasteDB web app behavior on db.wastefull.org</li>
            <li>Supabase Auth data used by WasteDB</li>
            <li>Google OAuth data as mediated by Supabase Auth</li>
            <li>First-party cookies and browser storage used by the app</li>
          </ul>
          <p className="text-[12px] text-black/50 dark:text-white/50">
            This document does not replace legal advice.
          </p>
        </section>

        {/* Data Controller */}
        <section className="space-y-2">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Data Controller
          </h2>
          <p>Wastefull, Inc. operates WasteDB.</p>
        </section>

        {/* PII We Receive */}
        <section className="space-y-4">
          <h2 className="text-[16px] normal text-black dark:text-white">
            What PII We Receive
          </h2>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              1. Direct auth input
            </h3>
            <p>
              When you sign in with email/password or magic link, the app sends:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address</li>
              <li>Password (email/password flows only)</li>
              <li>Optional display name (sign-up only)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              2. Supabase Auth user data
            </h3>
            <p>
              After a successful auth flow, WasteDB receives and stores the
              following fields:
            </p>
            <div className="retro-card p-0 overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    <th className="text-left p-3 font-normal normal">Field</th>
                    <th className="text-left p-3 font-normal normal">
                      Purpose
                    </th>
                    <th className="text-left p-3 font-normal normal hidden md:table-cell">
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {[
                    [
                      "user.id",
                      "Internal identity key",
                      "Persisted in session objects",
                    ],
                    [
                      "user.email",
                      "Account identity, sign-in, authorization",
                      "Persisted in session objects",
                    ],
                    [
                      "user name (derived)",
                      "Display name in UI and profile defaults",
                      "Persisted in profile data",
                    ],
                    [
                      "email_confirmed_at (status only)",
                      "Blocks unverified accounts",
                      "Checked at sign-in time",
                    ],
                    [
                      "app_metadata.provider",
                      "Verifies OAuth provider",
                      "Checked during OAuth exchange",
                    ],
                    [
                      "app_metadata.providers[]",
                      "Verifies Google provider is present",
                      "Checked during OAuth exchange",
                    ],
                  ].map(([field, purpose, retention]) => (
                    <tr key={field}>
                      <td className="p-3 font-mono text-[11px]">{field}</td>
                      <td className="p-3">{purpose}</td>
                      <td className="p-3 hidden md:table-cell text-black/50 dark:text-white/50">
                        {retention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              3. Metadata written by WasteDB
            </h3>
            <p>
              For email sign-up and magic-link account creation, WasteDB stores:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[12px]">
              <li>name</li>
              <li>isOrgEmail (boolean derived from email domain)</li>
              <li>signupIp (IP fragment; email/password sign-up only)</li>
              <li>signupTimestamp</li>
              <li>authMethod (magic-link flow)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              4. Google OAuth-derived data
            </h3>
            <p>
              WasteDB uses Google sign-in through Supabase OAuth.{" "}
              <strong>
                Google sign-in is restricted to @wastefull.org accounts.
              </strong>
            </p>
            <p>
              WasteDB receives OAuth identity data through Supabase Auth — not
              directly from Google APIs. At the point of session exchange it
              validates:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase user ID and email</li>
              <li>Provider metadata confirming Google as the provider</li>
              <li>Email verification status</li>
            </ul>
          </div>
        </section>

        {/* Cookies and storage */}
        <section className="space-y-4">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Session Cookie and Browser Storage
          </h2>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              Authentication cookie
            </h3>
            <p>
              WasteDB sets one first-party cookie to keep you signed in across
              browser restarts:
            </p>
            <div className="retro-card p-4 font-mono text-[12px] space-y-1">
              <p>
                <span className="text-black/50 dark:text-white/50">Name: </span>
                wastedb_session
              </p>
              <p>
                <span className="text-black/50 dark:text-white/50">
                  Purpose:{" "}
                </span>
                persists your signed-in session
              </p>
              <p>
                <span className="text-black/50 dark:text-white/50">
                  HttpOnly:{" "}
                </span>
                yes — not readable by JavaScript
              </p>
              <p>
                <span className="text-black/50 dark:text-white/50">
                  Secure:{" "}
                </span>
                yes — HTTPS only
              </p>
              <p>
                <span className="text-black/50 dark:text-white/50">
                  SameSite:{" "}
                </span>
                None (required for cross-origin API requests)
              </p>
              <p>
                <span className="text-black/50 dark:text-white/50">
                  Expires:{" "}
                </span>
                7 days, matching server-side session expiry
              </p>
            </div>
            <p>No tracking or analytics cookies are set.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              Browser storage
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-mono text-[12px]">
                  sessionStorage: wastedb_access_token
                </span>{" "}
                — in-tab copy of your session token; cleared when the tab closes
              </li>
              <li>
                <span className="font-mono text-[12px]">
                  sessionStorage: wastedb_user
                </span>{" "}
                — minimal user object (id, email, display name) for UI state;
                cleared when the tab closes
              </li>
              <li>
                <span className="font-mono text-[12px]">
                  localStorage: cookie-consent
                </span>{" "}
                — records that you acknowledged this notice; persists across
                sessions
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[14px] normal text-black dark:text-white">
              OAuth provider cookies
            </h3>
            <p>
              During Google OAuth and Supabase auth redirects, Google and/or
              Supabase domains may set their own cookies on their domains. These
              are controlled by those providers, not by WasteDB.
            </p>
          </div>
        </section>

        {/* Why */}
        <section className="space-y-3">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Why We Process This Data
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authenticate and authorize users by role</li>
            <li>Secure sign-in and prevent abuse</li>
            <li>Maintain active sessions</li>
            <li>Provide basic profile and display behavior</li>
          </ul>
        </section>

        {/* Sharing */}
        <section className="space-y-3">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Sharing
          </h2>
          <p>
            WasteDB relies on these service providers to process auth-related
            data:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase</strong> — authentication and session
              infrastructure
            </li>
            <li>
              <strong>Google</strong> — OAuth identity provider, when Google
              sign-in is used
            </li>
          </ul>
          <p>WasteDB does not use this data for advertising.</p>
        </section>

        {/* Your choices */}
        <section className="space-y-3">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Your Choices
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sign in with email/password or magic link</li>
            <li>Use Google OAuth (restricted to @wastefull.org accounts)</li>
            <li>
              Sign out to invalidate your session and clear in-app storage
            </li>
            <li>
              Clear cookies and browser storage in your browser settings at any
              time
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="space-y-2">
          <h2 className="text-[16px] normal text-black dark:text-white">
            Contact
          </h2>
          <p>
            For privacy questions related to WasteDB, contact Wastefull, Inc.
            through official project channels.
          </p>
        </section>
      </div>
    </PageTemplate>
  );
}
