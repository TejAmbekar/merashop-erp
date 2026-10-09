import { useState } from "react";
import { AlertTriangle, ArrowDownUp, Boxes, Layers, List, PackageX, Search, Warehouse } from "lucide-react";
import { useERP } from "../context/ERPContext";
import ProductThumbnail from "../components/ProductThumbnail";

const pageSize = 8;
const statusOf = product => Number(product.stock) === 0 ? "out" : Number(product.stock) <= 5 ? "low" : "in";
const quantity = value => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const rupees = value => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function Inventory() {
  const { products } = useERP();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [compact, setCompact] = useState(false);
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const lowStockCount = products.filter(product => statusOf(product) === "low").length;
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.purchasePrice || 0) * Number(product.stock || 0), 0);
  const filtered = products
    .filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter(product => statusFilter === "all" || statusOf(product) === statusFilter)
    .sort((first, second) => {
      if (sort === "stock") return Number(second.stock) - Number(first.stock);
      if (sort === "value") return Number(second.purchasePrice) * Number(second.stock) - Number(first.purchasePrice) * Number(first.stock);
      return first.name.localeCompare(second.name);
    });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const changeFilter = setter => event => { setter(event.target.value); setPage(1); };

  return <>
    <div className="page-title inventory-page-title">
      <div><h2>Inventory Management</h2><p>Live stock balance after purchases and sales.</p></div>
    </div>

    <section className="inventory-stat-grid" aria-label="Inventory summary">
      <InventoryStat icon={Boxes} tone="blue" label="Total Products" value={products.length} note="All products in system" />
      <InventoryStat icon={Layers} tone="green" label="Total Stock" value={quantity(totalStock)} note="Total quantity" />
      <InventoryStat icon={AlertTriangle} tone="amber" label="Low Stock Items" value={lowStockCount} note="Needs attention" />
      <InventoryStat icon={Warehouse} tone="violet" label="Inventory Value" value={rupees(inventoryValue)} note="Based on purchase price" />
    </section>

    <section className="panel product-inventory-panel inventory-panel">
      <div className="product-toolbar inventory-toolbar">
        <label className="product-search"><span className="sr-only">Search inventory</span><Search className="inventory-search-icon" size={16} /><input value={query} onChange={changeFilter(setQuery)} placeholder="Search product or SKU..." /></label>
        <label className="product-filter"><span className="sr-only">Filter inventory by status</span><select value={statusFilter} onChange={changeFilter(setStatusFilter)}><option value="all">All Status</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select></label>
        <label className="product-filter inventory-sort"><span className="sr-only">Sort inventory</span><ArrowDownUp size={16} /><select value={sort} onChange={changeFilter(setSort)}><option value="name">Sort by Product</option><option value="stock">Sort by Stock</option><option value="value">Sort by Inventory Value</option></select></label>
        <button type="button" className={`inventory-density-toggle${compact ? " active" : ""}`} aria-label={compact ? "Use comfortable row spacing" : "Use compact row spacing"} aria-pressed={compact} onClick={() => setCompact(value => !value)}><List size={18} /></button>
      </div>

      <div className="table-wrap products-table-wrap inventory-table-wrap"><table className={`products-table inventory-table${compact ? " compact" : ""}`}>
        <thead><tr><th>#</th><th colSpan="2">Product</th><th>SKU</th><th>Purchase Price</th><th>Sale Price</th><th>Current Stock</th><th>Status</th></tr></thead>
        <tbody>{visible.map((product, index) => <tr key={product.id}>
          <td className="product-row-number">{(page - 1) * pageSize + index + 1}</td>
          <td className="product-image-cell"><ProductThumbnail product={product} /></td>
          <td className="product-name-cell">{product.name}</td>
          <td className="product-sku-cell">{product.sku}</td>
          <td>{rupees(product.purchasePrice)}</td>
          <td>{rupees(product.salePrice)}</td>
          <td>{quantity(product.stock)} {product.unit}</td>
          <td><StockBadge product={product} /></td>
        </tr>)}</tbody>
      </table></div>
      {!visible.length && <div className="empty product-empty">No products match those filters.</div>}
      <div className="product-table-footer inventory-table-footer"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} products</span><Pagination page={page} pages={pages} setPage={setPage} /></div>
    </section>
  </>;
}

function InventoryStat({ icon: Icon, tone, label, value, note }) {
  return <article className={`product-stat ${tone}`}><span className="product-stat-icon"><Icon size={23} /></span><div><span className="product-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function StockBadge({ product }) {
  const status = statusOf(product);
  const label = status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock";
  return <span className={`product-stock-badge ${status}`}><i />{label}</span>;
}

function Pagination({ page, pages, setPage }) {
  return <div className="pagination product-pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>;
}