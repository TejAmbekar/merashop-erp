import { useState } from "react";
import { useERP } from "../context/ERPContext";

export default function PayLater() {
  const { payLater, addPayLaterPayment } = useERP();
  const [payment, setPayment] = useState({});
  const [expandedSale, setExpandedSale] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pages = Math.max(1, Math.ceil(payLater.length / pageSize));
  const visiblePayLater = payLater.slice((page - 1) * pageSize, page * pageSize);
  const [error, setError] = useState("");

  const submitPayment = async (event, sale) => {
    event.preventDefault();
    const form = payment[sale.id] || {};
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || amount > sale.remainingAmount) {
      setError(`Enter an amount up to Rs. ${sale.remainingAmount.toLocaleString("en-IN")}.`);
      return;
    }
    try {
      await addPayLaterPayment(sale.id, {
        amount,
        paymentMethod: form.paymentMethod || "cash",
        paymentDate: form.paymentDate || new Date().toISOString().slice(0, 10),
        notes: form.notes || ""
      });
      setPayment((current) => ({ ...current, [sale.id]: {} }));
      setError("");
    } catch {}
  };

  return <>
    <div className="page-title">
      <div><h2>Udhar / Pay Later</h2><p>Track customer balances and record payments until every account is settled.</p></div>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {!payLater.length && <div className="panel empty">No outstanding pay-later accounts.</div>}
    {visiblePayLater.map((sale) => {
      const form = payment[sale.id] || {};
      return <article className="panel pay-later-card" key={sale.id}>
        <div className="pay-later-heading">
          <div><h3>{sale.customer}</h3><span>{sale.mobile} · Sale date: {sale.date}</span></div>
          <strong className="danger">Due {sale.dueDate || "No date"}</strong>
        </div>
        <div className="pay-later-metrics">
          <div><span>Total</span><b>Rs. {sale.total.toLocaleString("en-IN")}</b></div>
          <div><span>Paid</span><b>Rs. {sale.paidAmount.toLocaleString("en-IN")}</b></div>
          <div><span>Remaining</span><b className="danger">Rs. {sale.remainingAmount.toLocaleString("en-IN")}</b></div>
        </div>
        <button type="button" className="secondary details-button" onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>{expandedSale === sale.id ? "Hide Details" : "View Details"}</button>
        {expandedSale === sale.id && <div className="pay-later-details"><div><b>Sale date</b><span>{sale.date}</span></div><div><b>Payment started via</b><span>{sale.paymentMethod.toUpperCase()}</span></div><div><b>Items</b><span>{sale.items.map((item) => `${item.qty} x product #${item.productId}`).join(", ")}</span></div>{sale.paymentNotes && <div><b>Note</b><span>{sale.paymentNotes}</span></div>}</div>}
        <form className="payment-form" onSubmit={(event) => submitPayment(event, sale)}>
          <label>Payment Amount<input type="number" min="0.01" max={sale.remainingAmount} step="0.01" value={form.amount || ""} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, amount: event.target.value } }))} required /></label>
          <label>Method<select value={form.paymentMethod || "cash"} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, paymentMethod: event.target.value } }))}><option value="cash">Cash</option><option value="upi">UPI</option></select></label>
          <label>Payment Date<input type="date" value={form.paymentDate || new Date().toISOString().slice(0, 10)} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, paymentDate: event.target.value } }))} required /></label>
          <label>Notes<input value={form.notes || ""} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, notes: event.target.value } }))} /></label>
          <button className="primary" type="submit">Record Payment</button>
        </form>
        {!!sale.payments.length && <div className="payment-history"><b>Payment history</b>{sale.payments.map((entry) => <span key={entry.id}>Rs. {entry.amount.toLocaleString("en-IN")} · {entry.paymentMethod.toUpperCase()} · {entry.paymentDate}</span>)}</div>}
      </article>;
    })}
    {!!payLater.length && <div className="pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </>;
}
