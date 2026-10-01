import { Fragment, useMemo, useState } from "react";
import { ArrowDownUp, BarChart3, CalendarDays, IndianRupee, ClipboardList, Eye, Percent, Search, ShoppingBag } from "lucide-react";
import { useERP } from "../context/ERPContext";

const pageSize = 8;
const localDateInput = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const initialDateRange = () => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { from: localDateInput(start), to: localDateInput(end) };
};
const formatRupees = value => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Profit() {
  const { sales, profit, totalSales, products } = useERP();
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);
  const customers = [...new Set(sales.map(sale => sale.customer).filter(Boolean))].sort((first, second) => first.localeCompare(second));
  const filteredSales = useMemo(() => sales
    .filter(sale => (!dateRange.from || sale.date >= dateRange.from) && (!dateRange.to || sale.date <= dateRange.to))
    .filter(sale => customerFilter === "all" || sale.customer === customerFilter)
    .filter(sale => `${sale.customer || ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((first, second) => {
      if (sort === "date-asc") return first.date.localeCompare(second.date);
      if (sort === "profit-desc") return Number(second.profit || 0) - Number(first.profit || 0);
      if (sort === "customer") return (first.customer || "").localeCompare(second.customer || "");
      return second.date.localeCompare(first.date) || Number(second.id) - Number(first.id);
    }), [sales, dateRange, customerFilter, query, sort]);
  const filteredTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const filteredProfit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
  const margin = filteredTotal ? filteredProfit / filteredTotal * 100 : 0;
  const pages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const visibleSales = filteredSales.slice((page - 1) * pageSize, page * pageSize);
  const setDate = key => event => { setDateRange(current => ({ ...current, [key]: event.target.value })); setPage(1); };
  const getProduct = id => products.find(product => product.id === Number(id));
  const getCost = sale => Math.max(0, Number(sale.total || 0) - Number(sale.profit || 0));

  return (
    <>
      <div className="profit-heading">
        <span className="profit-heading-icon"><BarChart3 size={24} /></span>
        <div><h2>Profit After Sale</h2><p>Profit is calculated using sale price minus purchase price.</p></div>
      </div>

      <section className="profit-stats" aria-label="Profit summary">
        <ProfitStat icon={ShoppingBag} tone="blue" label="Total Sales" value={formatRupees(filteredTotal)} note="Total bill amount" />
        <ProfitStat icon={IndianRupee} tone="green" label="Total Profit" value={formatRupees(filteredProfit)} note="Sale price - Purchase price" />
        <ProfitStat icon={Percent} tone="amber" label="Profit Margin" value={`${margin.toFixed(2)}%`} note="Overall profit margin" />
        <ProfitStat icon={ClipboardList} tone="violet" label="Total Orders" value={filteredSales.length} note="Completed sales" />
      </section>

      <section className="panel profit-panel">
        <div className="profit-toolbar">
          <label className="profit-date-filter"><CalendarDays size={16} /><span className="sr-only">From date</span><input type="date" value={dateRange.from} onChange={setDate("from")} /><span aria-hidden="true">–</span><span className="sr-only">To date</span><input type="date" value={dateRange.to} onChange={setDate("to")} /></label>
          <label className="profit-search"><Search size={16} /><span className="sr-only">Search customer</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search customer name..." /></label>
          <label className="profit-customer-filter"><span className="sr-only">Filter by customer</span><select value={customerFilter} onChange={event => { setCustomerFilter(event.target.value); setPage(1); }}><option value="all">All Customers</option>{customers.map(customer => <option key={customer} value={customer}>{customer}</option>)}</select></label>
          <label className="profit-sort"><ArrowDownUp size={15} /><span className="sr-only">Sort sales</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="date-desc">Sort by Date (Latest)</option><option value="date-asc">Sort by Date (Oldest)</option><option value="profit-desc">Sort by Profit</option><option value="customer">Sort by Customer</option></select></label>
        </div>

        <div className="table-wrap profit-table-wrap"><table className="profit-table">
          <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Bill Total</th><th>Cost Price</th><th>Profit</th><th>Margin %</th><th>Details</th></tr></thead>
          <tbody>
            {visibleSales.map((sale, index) => {
              const isOpen = expandedSaleId === sale.id;
              const cost = getCost(sale);
              const saleMargin = Number(sale.total) ? Number(sale.profit || 0) / Number(sale.total) * 100 : 0;
              return <Fragment key={sale.id}>
                <tr>
                  <td className="profit-row-number">{(page - 1) * pageSize + index + 1}</td>
                  <td>{sale.date}</td>
                  <td className="profit-customer-cell">{sale.customer}</td>
                  <td>{formatRupees(sale.total)}</td>
                  <td>{formatRupees(cost)}</td>
                  <td className="profit-value">{formatRupees(sale.profit)}</td>
                  <td><span className="profit-margin-badge">{saleMargin.toFixed(2)}%</span></td>
                  <td><button type="button" className="profit-details-button" aria-expanded={isOpen} onClick={() => setExpandedSaleId(isOpen ? null : sale.id)}><Eye size={15} />{isOpen ? "Hide Details" : "View Details"}</button></td>
                </tr>
                {isOpen && <tr className="profit-expanded-row"><td colSpan={8}><div className="profit-line-details">
                  <strong>{sale.customer} purchased</strong>
                  {sale.items.map((item, itemIndex) => {
                    const product = getProduct(item.productId);
                    const lineTotal = Number(item.qty) * Number(item.price);
                    const lineCost = Number(item.qty) * Number(item.costPrice ?? product?.purchasePrice ?? 0);
                    return <div className="profit-line-item" key={`${sale.id}-${itemIndex}`}><span>{itemIndex + 1}. {product?.name || "Unknown Product"} ({item.qty} {item.unit || product?.unit || "unit"})</span><span>{formatRupees(lineTotal)} <small>cost {formatRupees(lineCost)}</small></span></div>;
                  })}
                  <div className="profit-line-total"><span>Bill total</span><strong>{formatRupees(sale.total)}</strong></div>
                </div></td></tr>}
              </Fragment>;
            })}
          </tbody>
        </table></div>
        {!visibleSales.length && <div className="empty profit-empty">No sales match the selected filters.</div>}
        <div className="profit-table-footer"><span>Showing {filteredSales.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredSales.length)} of {filteredSales.length} entries</span><div className="pagination profit-pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>
    </>
  );
}

function ProfitStat({ icon: Icon, tone, label, value, note }) {
  return <article className={`profit-stat ${tone}`}><span className="profit-stat-icon"><Icon size={24} /></span><div><span className="profit-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
