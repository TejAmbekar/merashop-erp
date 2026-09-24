import { useState } from "react";
import { ArrowRight, LockKeyhole, Store, UserRound } from "lucide-react";
import { useERP } from "../context/ERPContext";

export default function Login() {
  const { login } = useERP();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try { await login(credentials); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  return <main className="login-screen"><div className="login-art"><div className="login-brand"><img src="/logo.svg" alt="Mera SHOP ERP logo" className="login-logo" /></div><div className="login-intro"><p className="eyebrow">Your shop, in control</p><h1>Make every sale<br /><em>count.</em></h1><p>One clear workspace for stock, purchases, sales and profit.</p></div><div className="login-stat"><strong>Inventory intelligence</strong><span>Know what is moving before the day moves you.</span></div></div><section className="login-panel"><div className="login-panel-inner"><div className="login-icon"><Store size={22} /></div><p className="eyebrow">Welcome back</p><h2>Sign in to Mera SHOP</h2><p className="login-subtitle">Enter your account details to continue.</p><form onSubmit={submit}><label>Username<div className="input-with-icon"><UserRound size={18} /><input autoComplete="username" required value={credentials.username} onChange={event => setCredentials({ ...credentials, username: event.target.value })} /></div></label><label>Password<div className="input-with-icon"><LockKeyhole size={18} /><input type="password" autoComplete="current-password" minLength="8" required value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })} /></div></label>{error && <div className="login-error" role="alert">{error}</div>}<button className="login-submit" disabled={loading}>{loading ? "Signing in..." : <>Enter workspace <ArrowRight size={18} /></>}</button></form><p className="login-footer">Secure access for your shop team</p></div></section></main>;
}