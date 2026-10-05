import { useMemo, useState } from "react";
import { ArrowDownUp, BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, Clock3, Eye, IndianRupee, Plus, Search, Users } from "lucide-react";
import { useERP } from "../context/ERPContext";

const money = value => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const isOverdue = sale => Boolean(sale.dueDate && sale.dueDate < new Date().toISOString().slice(0, 10));
const upiId = import.meta.env.VITE_UPI_ID || "";
const upiName = import.meta.env.VITE_UPI_NAME || "Mera SHOP";
const upiPaymentUrl = amount => {
  const params = new URLSearchParams({ pa: upiId, pn: upiName, am: Number(amount).toFixed(2), cu: "INR" });
  return `upi://pay?${params.toString()}`;
};
const qrImageUrl = amount => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPaymentUrl(amount))}`;

export default function PayLater() {
  const { payLater, products, addPayLaterPayment } = useERP();
  const [payment, setPayment] = useState({});
  const [expandedSale, setExpandedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("due-asc");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [error, setError] = useState("");
  const customers = new Set(payLater.map(sale => sale.customer?.trim().toLowerCase()).filter(Boolean)).size;
  const outstanding = payLater.reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0);
  const collected = payLater.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0);
  const overdueCount = payLater.filter(isOverdue).length;
  const filteredPayLater = useMemo(() => payLater
    .filter(sale => `${sale.customer || ""} ${sale.mobile || ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter(sale => statusFilter === "all" || (statusFilter === "overdue" ? isOverdue(sale) : !isOverdue(sale)))
    .sort((first, second) => {
      if (sort === "due-desc") return (second.dueDate || "9999").localeCompare(first.dueDate || "9999");
      if (sort === "balance-desc") return Number(second.remainingAmount) - Number(first.remainingAmount);
      return (first.dueDate || "9999").localeCompare(second.dueDate || "9999");
    }), [payLater, query, statusFilter, sort]);
  const pages = Math.max(1, Math.ceil(filteredPayLater.length / pageSize));
  const visiblePayLater = filteredPayLater.slice((page - 1) * pageSize, page * pageSize);

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
    <div className="pay-later-title"><span className="pay-later-title-icon"><Users size={24} /></span><div><h2>Udhar / Pay Later</h2><p>Track customer balances and record payments until every account is settled.</p></div></div>
    <section className="pay-later-stats" aria-label="Pay later summary">
      <PayLaterStat icon={Users} tone="blue" label="Total Customers" value={customers} note="With pending balance" />
      <PayLaterStat icon={IndianRupee} tone="red" label="Total Outstanding" value={money(outstanding)} note="Pending to receive" />
      <PayLaterStat icon={CheckCircle2} tone="green" label="Total Collected" value={money(collected)} note="Payments received" />
      <PayLaterStat icon={Clock3} tone="violet" label="Overdue Accounts" value={overdueCount} note="Need attention" />
    </section>
    {error && <div className="error-banner" role="alert">{error}</div>}

    <section className="pay-later-list-panel">
      <div className="pay-later-toolbar">
        <label className="pay-later-search"><Search size={16} /><span className="sr-only">Search customer name or phone</span><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search customer name or phone..." /></label>
        <label className="pay-later-filter"><span className="sr-only">Filter accounts by status</span><select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1); }}><option value="all">All Status</option><option value="overdue">Overdue</option><option value="current">Not Overdue</option></select></label>
        <label className="pay-later-sort"><ArrowDownUp size={15} /><span className="sr-only">Sort accounts</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="due-asc">Sort by Due Date (Earliest)</option><option value="due-desc">Sort by Due Date (Latest)</option><option value="balance-desc">Sort by Balance</option></select></label>
      </div>

      {!payLater.length && <div className="pay-later-empty"><BadgeCheck size={30} /><strong>No outstanding pay-later accounts</strong><span>All customer balances are settled.</span></div>}
      {payLater.length > 0 && !visiblePayLater.length && <div className="pay-later-empty"><Search size={26} /><strong>No matching accounts</strong><span>Try another customer name, phone number, or status.</span></div>}

      {visiblePayLater.map(sale => {
        const form = payment[sale.id] || {};
        const isExpanded = expandedSale === sale.id;
        const overdue = isOverdue(sale);
        return <article className={`pay-later-card${isExpanded ? " expanded" : ""}`} key={sale.id}>
          <div className="pay-later-card-header">
            <span className="pay-later-avatar">{(sale.customer || "?").trim().charAt(0).toUpperCase()}</span>
            <span className="pay-later-customer"><strong>{sale.customer}</strong><small>{sale.mobile} <i /> Sale date: {sale.date}</small></span>
            <span className={`pay-later-due ${overdue ? "overdue" : "current"}`}>{overdue ? <Clock3 size={14} /> : <CheckCircle2 size={14} />}{sale.remainingAmount <= 0 ? "Settled" : sale.dueDate ? `Due ${sale.dueDate}` : "No due date"}</span>
            {!isExpanded && <span className="pay-later-header-metrics"><span><small>Total</small><b>{money(sale.total)}</b></span><span><small>Paid</small><b>{money(sale.paidAmount)}</b></span><span><small>Remaining</small><b className={sale.remainingAmount > 0 ? "balance-due" : "balance-paid"}>{money(sale.remainingAmount)}</b></span></span>}
            <button type="button" className="pay-later-chevron" aria-label={isExpanded ? "Collapse account" : "Expand account"} aria-expanded={isExpanded} onClick={() => setExpandedSale(isExpanded ? null : sale.id)}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
          </div>

          {isExpanded && <div className="pay-later-expanded-content">
            <div className="pay-later-expanded-summary">
              <div><small>Total</small><strong>{money(sale.total)}</strong></div><div><small>Paid</small><strong>{money(sale.paidAmount)}</strong></div><div><small>Remaining</small><strong className={sale.remainingAmount > 0 ? "balance-due" : "balance-paid"}>{money(sale.remainingAmount)}</strong></div>
              <button type="button" className="pay-later-view-details" onClick={() => setSaleDetails(saleDetails === sale.id ? null : sale.id)}><Eye size={15} />{saleDetails === sale.id ? "Hide Details" : "View Details"}</button>
            </div>
            {saleDetails === sale.id && <div className="pay-later-details pay-later-sale-details">
              <div className="pay-later-sale-meta"><div><b>Customer</b><span>{sale.customer}</span></div><div><b>Phone</b><span>{sale.mobile}</span></div><div><b>Sale date</b><span>{sale.date}</span></div><div><b>Due date</b><span>{sale.dueDate || "Not set"}</span></div><div><b>Payment started via</b><span>{sale.paymentMethod.toUpperCase()}</span></div>{sale.paymentNotes && <div><b>Sale note</b><span>{sale.paymentNotes}</span></div>}</div>
              <div className="pay-later-sale-items"><h4>Sale Items</h4><div className="table-wrap"><table><thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{sale.items.map((item, index) => {
                const product = products.find(entry => Number(entry.id) === Number(item.productId));
                const lineTotal = Number(item.qty) * Number(item.price);
                return <tr key={`${sale.id}-${item.productId}-${index}`}><td>{index + 1}</td><td>{product?.name || `Product #${item.productId}`}</td><td>{product?.sku || "-"}</td><td>{item.qty} {item.unit || product?.unit || "unit"}</td><td>{money(item.price)}</td><td>{money(lineTotal)}</td></tr>;
              })}</tbody></table></div></div>
            </div>}
            {!!sale.payments.length && <div className="pay-later-payment-history"><h4>Payment History</h4><div className="table-wrap"><table><thead><tr><th>#</th><th>Payment Amount</th><th>Method</th><th>Payment Date</th><th>Notes</th></tr></thead><tbody>{sale.payments.map((entry, index) => <tr key={entry.id}><td>{index + 1}</td><td className="payment-history-amount">{money(entry.amount)}</td><td><span className={`payment-method-pill ${entry.paymentMethod}`}>{entry.paymentMethod}</span></td><td>{entry.paymentDate}</td><td>{entry.notes || "-"}</td></tr>)}</tbody></table></div></div>}
            <form className="payment-form pay-later-payment-form" onSubmit={(event) => submitPayment(event, sale)}>
              <label>Payment Amount<input type="number" min="0.01" max={sale.remainingAmount} step="0.01" value={form.amount || ""} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, amount: event.target.value } }))} required /></label>
              <label>Method<select value={form.paymentMethod || "cash"} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, paymentMethod: event.target.value } }))}><option value="cash">Cash</option><option value="upi">UPI</option></select></label>
              <label>Payment Date<input type="date" value={form.paymentDate || new Date().toISOString().slice(0, 10)} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, paymentDate: event.target.value } }))} required /></label>
              <label>Notes<input value={form.notes || ""} onChange={(event) => setPayment((current) => ({ ...current, [sale.id]: { ...form, notes: event.target.value } }))} /></label>
              <button className="primary" type="submit"><Plus size={17} />Record Payment</button>
            </form>
            {form.paymentMethod === "upi" && <div className="pay-later-upi-panel">
              {!upiId ? <p>Set <code>VITE_UPI_ID</code> in your environment to accept UPI payments.</p> : !Number(form.amount) || Number(form.amount) <= 0 ? <p>Enter a payment amount to generate its UPI QR code.</p> : Number(form.amount) > Number(sale.remainingAmount) ? <p>Enter an amount within the remaining balance to generate the QR code.</p> : <><img src={qrImageUrl(form.amount)} alt={`UPI QR code for ${money(form.amount)}`} /><div><strong>Pay {money(form.amount)} with UPI</strong><span>Scan this QR code using any UPI app.</span><a href={upiPaymentUrl(form.amount)}>Open UPI app</a></div></>}
            </div>}
          </div>}
        </article>;
      })}
      {!!filteredPayLater.length && <div className="pay-later-footer"><span>Showing {Math.min((page - 1) * pageSize + 1, filteredPayLater.length)} to {Math.min(page * pageSize, filteredPayLater.length)} of {filteredPayLater.length} accounts</span><div className="pagination pay-later-pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}
    </section>
  </>;
}

function PayLaterStat({ icon: Icon, tone, label, value, note }) {
  return <article className={`pay-later-stat ${tone}`}><span className="pay-later-stat-icon"><Icon size={23} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
