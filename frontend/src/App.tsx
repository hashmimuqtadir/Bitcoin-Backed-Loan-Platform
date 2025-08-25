// frontend/src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import LoanForm from "./components/LoanForm";
import LoanDetails from "./components/LoanDetails";

/* ────────────  CHANGE THESE IF NEEDED ──────────── */
const II_CANISTER = "uxrrr-q7777-77774-qaaaq-cai";      // local Internet-Identity
const HOST        = "http://127.0.0.1:8000";            // local replica
const BACKEND_ID  = "uxrrr-q7777-77774-qaaaq-cai";      // ← put your backend ID here
/* ────────────────────────────────────────────────── */

/* Minimal IDL – add methods as you need them */
const idlFactory = ({ IDL }: any) =>
  IDL.Service({
    get_btc_price:      IDL.Func([], [IDL.Record({ btc_price_usd: IDL.Float64 })], ["query"]),
    create_user_profile:IDL.Func([], [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })], [])
  });

export default function App() {
  /* ─── state ───────────────────────────────────── */
  const [authClient,     setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthed,       setIsAuthed]   = useState(false);
  const [principal,      setPrincipal]  = useState<any>(null);
  const [backendActor,   setBackend]    = useState<any>(null);

  /* Create AuthClient once – before user clicks */
  useEffect(() => { AuthClient.create().then(setAuthClient); }, []);

  /* ─── login ───────────────────────────────────── */
  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: `${HOST}/?canisterId=${II_CANISTER}`,
      windowOpenerFeatures: "toolbar=0,location=0,menubar=0,width=600,height=700",
      onSuccess: async () => {
        const identity  = authClient.getIdentity();
        const principal = identity.getPrincipal();
        setIsAuthed(true);
        setPrincipal(principal);

        const agent = new HttpAgent({ identity, host: HOST });
        await agent.fetchRootKey();                 // local dev only

        const actor = Actor.createActor(idlFactory, {
          agent, canisterId: BACKEND_ID
        });
        setBackend(actor);
      }
    });
  };

  /* ─── logout ──────────────────────────────────── */
  const logout = async () => {
    if (authClient) await authClient.logout();
    setIsAuthed(false);
    setPrincipal(null);
    setBackend(null);
  };

  if (!authClient) return <div className="p-8">Initialising authentication…</div>;

  /* ─── routes ──────────────────────────────────── */
  return (
    <Router>
      <Header
        isAuthenticated={isAuthed}
        principal={principal}
        onLogin={login}
        onLogout={logout}
      />

      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/"           element={<Dashboard actor={backendActor} isAuthenticated={isAuthed} principal={principal} />} />
          <Route path="/loan/new"   element={<LoanForm  actor={backendActor} isAuthenticated={isAuthed} />} />
          <Route path="/loan/:id"   element={<LoanDetails actor={backendActor} isAuthenticated={isAuthed} />} />
        </Routes>
      </main>
    </Router>
  );
}
