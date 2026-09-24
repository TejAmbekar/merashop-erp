import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, ReceiptText, Boxes, TrendingUp, PackagePlus } from "lucide-react";
import { useERP } from "./context/ERPContext";
import Dashboard from "./pages/Dashboard";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Profit from "./pages/Profit";
import PayLater from "./pages/PayLater";
import Login from "./pages/Login";

const nav = [
  ["/", "Dashboard", LayoutDashboard],
  ["/purchase", "Purchase", PackagePlus],
  ["/sales", "Sale", ReceiptText],
  ["/inventory", "Inventory", Boxes],
  ["/products", "Products", ShoppingCart],
  ["/profit", "Profit", TrendingUp]
  ,["/pay-later", "Udhar / Pay Later", ReceiptText]
];

function Layout({ children }) {
  const { error, user, logout } = useERP();
  return <div className="app">
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.svg" alt="Mera SHOP ERP logo" className="brand-logo" />
      </div>
      <nav>{nav.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({isActive}) => isActive ? "nav active" : "nav"}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="side-note">Inventory updates automatically after every purchase and sale.</div>
    </aside>
    <main className="main"><header><div><h1>Mera SHOP ERP</h1><span>Purchase • Sales • Inventory Management</span></div><div className="header-actions"><div className="today">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div><button className="logout-button" onClick={logout}>Log out</button></div></header><section className="content">{error && <div className="error-banner" role="alert">{error}</div>}{children}</section></main>
  </div>;
}
export default function App() { const { user } = useERP(); if (!user) return <Login />; return <Layout><Routes>
  <Route path="/" element={<Dashboard/>}/><Route path="/purchase" element={<Purchase/>}/><Route path="/sales" element={<Sales/>}/>
  <Route path="/inventory" element={<Inventory/>}/><Route path="/products" element={<Products/>}/><Route path="/profit" element={<Profit/>}/><Route path="/pay-later" element={<PayLater/>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></Layout>; }