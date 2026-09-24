import { createContext, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const ERPContext = createContext(null);

async function request(path, options = {}) {
  const token = localStorage.getItem("mera_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The server request failed");
  return body;
}

export function ERPProvider({ children }) {
  const [user, setUser] = useState(() => { const savedUser = localStorage.getItem("mera_user"); return savedUser ? JSON.parse(savedUser) : null; });
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [payLater, setPayLater] = useState([]);
  const [error, setError] = useState("");

  const login = async credentials => {
    const result = await request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    localStorage.setItem("mera_token", result.token);
    localStorage.setItem("mera_user", JSON.stringify(result.user));
    setUser(result.user);
    setError("");
  };

  const logout = () => { localStorage.removeItem("mera_token"); localStorage.removeItem("mera_user"); setUser(null); setProducts([]); setPurchases([]); setSales([]); setError(""); };

  const refresh = async () => {
    try {
      const [nextProducts, nextPurchases, nextSales, nextPayLater] = await Promise.all([request("/products"), request("/purchases"), request("/sales"), request("/pay-later")]);
      setProducts(nextProducts); setPurchases(nextPurchases); setSales(nextSales); setPayLater(nextPayLater); setError("");
    } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const mutate = async (path, payload, method = "POST") => {
    try { const result = await request(path, { method, body: JSON.stringify(payload) }); await refresh(); return result; }
    catch (requestError) { setError(requestError.message); throw requestError; }
  };

  const addPurchase = purchase => mutate("/purchases", purchase);
  const addSale = sale => mutate("/sales", sale);
  const addProduct = product => mutate("/products", product);
  const updateProduct = (id, product) => mutate(`/products/${id}`, product, "PATCH");
  const addPayLaterPayment = (saleId, payment) => mutate(`/pay-later/${saleId}/payments`, payment);
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const profit = sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);

  return <ERPContext.Provider value={{ user, login, logout, products, purchases, sales, payLater, addPurchase, addSale, addProduct, updateProduct, addPayLaterPayment, totalSales, totalPurchases, profit, error, refresh }}>{children}</ERPContext.Provider>;
}
export const useERP = () => useContext(ERPContext);