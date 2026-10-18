/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">Educate MW</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          The full app is being restored from backup. Please check back in a few minutes.
        </p>
        <a
          href="https://wa.me/265987066051"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold"
        >
          WhatsApp Support
        </a>
      </div>
    </div>
  );
}
