import { Fragment, useMemo, useState } from "react";
import { ArrowDownUp, CalendarDays, ChevronDown, ChevronUp, Eye, FileClock, PackageCheck, Search, ShoppingBag, Truck } from "lucide-react";
import { useERP } from "../context/ERPContext";

const pageSize = 8;
const localDateInput = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const initialDateRange = () => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { from: localDateInput(start), to: localDateInput(end) };
};
const money = value => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const quantity = value => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

export default function PurchaseHistory() {
  const { purchases, products } = useERP();
  const [expandedId, setExpandedId] = useState(null);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);
  const productMap = new Map(products.map(product => [Number(product.id), product]));
  const suppliers = new Set(purchases.map(purchase => purchase.supplier?.trim().toLowerCase()).filter(Boolean));
  const filteredPurchases = useMemo(() => purchases
    .filter(purchase => (!dateRange.from || purchase.date >= dateRange.from) && (!dateRange.to || purchase.date <= dateRange.to))
    .filter(purchase => (purchase.supplier || "").toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => {
      if (sort === "date-asc") return first.date.localeCompare(second.date);
      if (sort === "supplier") return first.supplier.localeCompare(second.supplier);
      return second.date.localeCompare(first.date) || Number(second.id) - Number(first.id);
    }), [purchases, dateRange, query, sort]);
  const totalPurchase = filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const itemQuantity = filteredPurchases.reduce((sum, purchase) => sum + (purchase.items || []).reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0), 0);
  const pages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const visiblePurchases = filteredPurchases.slice((page - 1) * pageSize, page * pageSize);
  const setDate = key => event => { setDateRange(current => ({ ...current, [key]: event.target.value })); setPage(1); };

  return <>
    <div className="purchase-history-heading">
      <span className="purchase-history-heading-icon"><FileClock size={23} /></span>
      <div><h2>Purchase History</h2><p>Review all purchase records, suppliers, and transaction totals.</p></div>
    </div>

    <section className="purchase-history-stats" aria-label="Purchase history summary">
      <PurchaseStat icon={ShoppingBag} tone="violet" label="Total Purchases" value={money(totalPurchase)} note="Purchase amount in range" />
      <PurchaseStat icon={FileClock} tone="blue" label="Total Orders" value={filteredPurchases.length} note="Purchase orders" />
      <PurchaseStat icon={PackageCheck} tone="green" label="Total Items" value={quantity(itemQuantity)} note="Units purchased" />
      <PurchaseStat icon={Truck} tone="amber" label="Suppliers" value={suppliers.size} note="Active suppliers" />
    </section>

    <section className="panel purchase-history-panel">
      <div className="purchase-history-toolbar">
        <label className="purchase-history-date"><CalendarDays size={16} /><span className="sr-only">From date</span><input type="date" value={dateRange.from} onChange={setDate("from")} /><span aria-hidden="true">-</span><span className="sr-only">To date</span><input type="date" value={dateRange.to} onChange={setDate("to")} /></label>
        <label className="purchase-history-search"><Search size={16} /><span className="sr-only">Search supplier</span><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search supplier name..." /></label>
        <label className="purchase-history-sort"><ArrowDownUp size={15} /><span className="sr-only">Sort purchases</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="date-desc">Sort by Date (Latest)</option><option value="date-asc">Sort by Date (Oldest)</option><option value="supplier">Sort by Supplier</option></select></label>
      </div>

      <div className="table-wrap purchase-history-table-wrap"><table className="purchase-history-table">
        <thead><tr><th>#</th><th>Supplier</th><th>Date</th><th>Items</th><th>Total</th><th>Action</th></tr></thead>
        <tbody>{visiblePurchases.map((purchase, index) => {
          const isExpanded = expandedId === purchase.id;
          const items = purchase.items || [];
          return <Fragment key={purchase.id}>
            <tr className={isExpanded ? "purchase-history-row expanded" : "purchase-history-row"}>
              <td className="purchase-history-number">{(page - 1) * pageSize + index + 1}</td>
              <td className="purchase-history-supplier">{purchase.supplier}</td>
              <td>{purchase.date}</td>
              <td><button className="purchase-item-count" type="button" aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : purchase.id)}>{items.length} {items.length === 1 ? "item" : "items"}{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></td>
              <td className="purchase-history-total">{money(purchase.total)}</td>
              <td><button type="button" className="purchase-history-view" aria-label={`${isExpanded ? "Hide" : "View"} items for ${purchase.supplier}`} aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : purchase.id)}><Eye size={15} />{isExpanded ? "Hide" : "View"}</button></td>
            </tr>
            {isExpanded && <tr className="purchase-history-expanded-row"><td colSpan={6}>
              <div className="purchase-history-items-wrap"><table className="purchase-history-items">
                <thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Quantity</th><th>Purchase Price</th><th>Total</th></tr></thead>
                <tbody>{items.map((item, itemIndex) => {
                  const product = productMap.get(Number(item.productId));
                  return <tr key={`${purchase.id}-${item.productId}-${itemIndex}`}><td>{itemIndex + 1}</td><td>{product?.name || `Product #${item.productId}`}</td><td>{product?.sku || "-"}</td><td>{quantity(item.qty)} {item.unit || product?.unit || "unit"}</td><td>{money(item.price)}</td><td>{money(Number(item.qty) * Number(item.price))}</td></tr>;
                })}</tbody>
              </table></div>
            </td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
      {!visiblePurchases.length && <div className="empty purchase-history-empty">{purchases.length ? "No purchases match these filters." : "No purchase records yet."}</div>}
      <div className="purchase-history-footer"><span>Showing {filteredPurchases.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredPurchases.length)} of {filteredPurchases.length} purchases</span><div className="pagination purchase-history-pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
    </section>
  </>;
}

function PurchaseStat({ icon: Icon, tone, label, value, note }) {
  return <article className={`purchase-history-stat ${tone}`}><span className="purchase-history-stat-icon"><Icon size={23} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
