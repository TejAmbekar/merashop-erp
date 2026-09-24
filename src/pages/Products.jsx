import { useState } from "react";
import { useERP } from "../context/ERPContext";

const pageSize = 8;
const emptyForm = { name: "", sku: "", purchasePrice: "", salePrice: "", stock: "", unit: "Piece" };

export default function Products() {
  const { products, addProduct, updateProduct } = useERP();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const filtered = products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = async event => { event.preventDefault(); setError(""); try { if (editing) await updateProduct(editing.id, { name: form.name, purchasePrice: form.purchasePrice, salePrice: form.salePrice, stock: form.stock }); else await addProduct(form); setForm(emptyForm); setEditing(null); setOpen(false); } catch (requestError) { setError(requestError.message); } };
  const edit = product => { setEditing(product); setForm({ ...product }); setOpen(true); setError(""); };
  return <><div className="page-title"><div><h2>Products</h2><p>Manage products and opening stock.</p></div><button className="primary" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(!open); }}>+ Add Product</button></div>{open && <form className="panel" onSubmit={save}>{error && <div className="error-banner">{error}</div>}<div className="form-grid">{editing && <><label>Product<input required value={form.name} onChange={event => setField("name", event.target.value)} /></label><label>SKU<input value={form.sku} readOnly /></label></>}{!editing && <><label>Name<input required value={form.name} onChange={event => setField("name", event.target.value)} /></label><label>SKU<input required value={form.sku} onChange={event => setField("sku", event.target.value)} /></label></>}<label>Purchase Price<input type="number" min="0" required value={form.purchasePrice} onChange={event => setField("purchasePrice", event.target.value)} /></label><label>Sale Price<input type="number" min="0" required value={form.salePrice} onChange={event => setField("salePrice", event.target.value)} /></label><label>Stock<input type="number" min="0" required value={form.stock} onChange={event => setField("stock", event.target.value)} /></label>{!editing && <label>Unit<input value={form.unit} onChange={event => setField("unit", event.target.value)} /></label>}</div><button className="primary" type="submit">{editing ? "Update Product" : "Save Product"}</button></form>}<div className="panel"><div className="toolbar"><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search product or SKU" aria-label="Search products" /></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>SKU</th><th>Purchase</th><th>Sale</th><th>Stock</th><th>Action</th></tr></thead><tbody>{visible.map(product => <tr key={product.id}><td>{product.name}</td><td>{product.sku}</td><td>Rs. {product.purchasePrice}</td><td>Rs. {product.salePrice}</td><td>{product.stock} {product.unit}</td><td><button type="button" className="secondary" onClick={() => edit(product)}>Edit</button></td></tr>)}</tbody></table></div>{!visible.length && <div className="empty">No matching products.</div>}<Pagination page={page} pages={pages} setPage={setPage} /></div></>;
}

function Pagination({ page, pages, setPage }) { return <div className="pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>; }
