import { useState } from "react";
import { useERP } from "../context/ERPContext";

const pageSize = 8;
export default function Inventory() {
  const { products } = useERP();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <><Page title="Inventory Management" sub="Live stock balance after purchases and sales." /><div className="panel"><div className="toolbar"><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search product or SKU" aria-label="Search inventory" /></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Purchase Price</th><th>Sale Price</th><th>Current Stock</th><th>Status</th></tr></thead><tbody>{visible.map(product => <tr key={product.id}><td><b>{product.name}</b></td><td>{product.sku}</td><td>Rs. {product.purchasePrice}</td><td>Rs. {product.salePrice}</td><td>{product.stock} {product.unit}</td><td><span className={product.stock <= 5 ? "badge danger-bg" : "badge"}>{product.stock <= 5 ? "Low Stock" : "In Stock"}</span></td></tr>)}</tbody></table></div>{!visible.length && <div className="empty">No matching products.</div>}<Pagination page={page} pages={pages} setPage={setPage} /></div></>;
}
function Pagination({ page, pages, setPage }) { return <div className="pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>; }
function Page({ title, sub }) { return <div className="page-title"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
