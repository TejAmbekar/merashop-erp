import { useState } from "react";
import { AlertTriangle, ArrowDownUp, Boxes, Eye, ImagePlus, PackageCheck, PackageX, Pencil, Plus, X } from "lucide-react";
import { useERP } from "../context/ERPContext";
import ProductThumbnail from "../components/ProductThumbnail";

const pageSize = 8;
const maxImageSize = 1_000_000;
const emptyForm = { name: "", sku: "", purchasePrice: "", salePrice: "", stock: "", unit: "Piece", image: "" };

const formatPrice = value => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const stockStatus = product => Number(product.stock) === 0 ? "out" : Number(product.stock) <= 5 ? "low" : "in";

export default function Products() {
  const { products, addProduct, updateProduct } = useERP();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const inStockCount = products.filter(product => stockStatus(product) === "in").length;
  const lowStockCount = products.filter(product => stockStatus(product) === "low").length;
  const outOfStockCount = products.filter(product => stockStatus(product) === "out").length;
  const filtered = products
    .filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter(product => statusFilter === "all" || stockStatus(product) === statusFilter)
    .sort((first, second) => {
      if (sort === "stock") return Number(second.stock) - Number(first.stock);
      if (sort === "price-low") return Number(first.salePrice) - Number(second.salePrice);
      if (sort === "price-high") return Number(second.salePrice) - Number(first.salePrice);
      return first.name.localeCompare(second.name);
    });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const startNewProduct = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(value => !value);
  };

  const edit = product => {
    setEditing(product);
    setForm({ ...emptyForm, ...product });
    setError("");
    setOpen(true);
    setViewing(null);
  };

  const uploadImage = event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("Product images must be 1 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setField("image", String(reader.result));
      setError("");
    };
    reader.onerror = () => setError("The selected image could not be loaded.");
    reader.readAsDataURL(file);
  };

  const save = async event => {
    event.preventDefault();
    setError("");
    const payload = { ...form, image: form.image || null };
    try {
      if (editing) await updateProduct(editing.id, payload);
      else await addProduct(payload);
      setForm(emptyForm);
      setEditing(null);
      setOpen(false);
    } catch (requestError) { setError(requestError.message); }
  };

  const changeFilter = setter => event => {
    setter(event.target.value);
    setPage(1);
  };

  return <>
    <div className="page-title products-page-title">
      <div><h2>Products</h2><p>Manage products, pricing, and opening stock.</p></div>
      <button className="primary products-add-button" onClick={startNewProduct}><Plus size={18} /> Add Product</button>
    </div>

    <section className="product-stats" aria-label="Product stock summary">
      <ProductStat icon={Boxes} tone="blue" label="Total Products" value={products.length} note="All products in system" />
      <ProductStat icon={PackageCheck} tone="green" label="In Stock" value={inStockCount} note="Products available" />
      <ProductStat icon={AlertTriangle} tone="amber" label="Low Stock" value={lowStockCount} note="Needs attention" />
      <ProductStat icon={PackageX} tone="red" label="Out of Stock" value={outOfStockCount} note="Currently unavailable" />
    </section>

    {open && <form className="panel product-form" onSubmit={save}>
      <div className="product-form-heading">
        <div><h3>{editing ? "Edit Product" : "Add Product"}</h3><p>Product details and inventory image</p></div>
        <button type="button" className="product-close-button" aria-label="Close product form" onClick={() => { setOpen(false); setError(""); }}><X size={19} /></button>
      </div>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="product-form-layout">
        <label className="product-image-upload">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} aria-label="Upload product image" />
          {form.image ? <img src={form.image} alt="Product preview" /> : <><ImagePlus size={28} /><strong>Upload product image</strong><span>JPG, PNG, or WebP · up to 1 MB</span></>}
        </label>
        <div className="product-form-fields">
          <label>Product name<input required maxLength="160" value={form.name} onChange={event => setField("name", event.target.value)} placeholder="e.g. Basmati Rice" /></label>
          <label>SKU<input required maxLength="80" value={form.sku} onChange={event => setField("sku", event.target.value)} placeholder="e.g. RICE25" /></label>
          <label>Purchase price<input type="number" min="0" step="0.01" inputMode="decimal" required value={form.purchasePrice} onChange={event => setField("purchasePrice", event.target.value)} /></label>
          <label>Sale price<input type="number" min="0" step="0.01" inputMode="decimal" required value={form.salePrice} onChange={event => setField("salePrice", event.target.value)} /></label>
          <label>Stock<input type="number" min="0" step="0.01" inputMode="decimal" required value={form.stock} onChange={event => setField("stock", event.target.value)} /></label>
          <label>Unit<input required maxLength="40" value={form.unit} onChange={event => setField("unit", event.target.value)} placeholder="Piece, Kg, Bag..." /></label>
        </div>
      </div>
      {form.image && <button type="button" className="product-remove-image" onClick={() => setField("image", "")}>Remove image</button>}
      <div className="product-form-actions"><button type="button" className="secondary" onClick={() => { setOpen(false); setError(""); }}>Cancel</button><button className="primary" type="submit">{editing ? "Save Changes" : "Save Product"}</button></div>
    </form>}

    <section className="panel product-inventory-panel">
      <div className="product-toolbar">
        <label className="product-search"><span className="sr-only">Search products</span><input value={query} onChange={changeFilter(setQuery)} placeholder="Search product or SKU..." /></label>
        <label className="product-filter"><span className="sr-only">Filter products by stock status</span><select value={statusFilter} onChange={changeFilter(setStatusFilter)}><option value="all">All Status</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select></label>
        <label className="product-filter product-sort"><span className="sr-only">Sort products</span><ArrowDownUp size={16} /><select value={sort} onChange={changeFilter(setSort)}><option value="name">Sort by Name</option><option value="stock">Stock: High to Low</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option></select></label>
      </div>
      <div className="table-wrap products-table-wrap"><table className="products-table">
        <thead><tr><th>#</th><th colSpan="2">Product</th><th>SKU</th><th>Purchase Price</th><th>Sale Price</th><th>Current Stock</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{visible.map((product, index) => <tr key={product.id}>
          <td className="product-row-number">{(page - 1) * pageSize + index + 1}</td>
          <td className="product-image-cell"><ProductThumbnail product={product} /></td>
          <td className="product-name-cell">{product.name}</td>
          <td className="product-sku-cell">{product.sku}</td>
          <td>Rs. {formatPrice(product.purchasePrice)}</td>
          <td>Rs. {formatPrice(product.salePrice)}</td>
          <td>{formatPrice(product.stock)} {product.unit}</td>
          <td><StockBadge product={product} /></td>
          <td><div className="product-actions"><button type="button" className="product-action view" aria-label={`View ${product.name}`} onClick={() => setViewing(product)}><Eye size={16} /></button><button type="button" className="product-action edit" aria-label={`Edit ${product.name}`} onClick={() => edit(product)}><Pencil size={16} /></button></div></td>
        </tr>)}</tbody>
      </table></div>
      {!visible.length && <div className="empty product-empty">No products match those filters.</div>}
      <div className="product-table-footer"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} products</span><Pagination page={page} pages={pages} setPage={setPage} /></div>
    </section>

    {viewing && <div className="product-dialog-backdrop" onClick={() => setViewing(null)}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="product-close-button" aria-label="Close product details" onClick={() => setViewing(null)}><X size={19} /></button>
        <ProductThumbnail product={viewing} large />
        <span className="product-dialog-sku">SKU {viewing.sku}</span>
        <h2 id="product-dialog-title">{viewing.name}</h2>
        <StockBadge product={viewing} />
        <dl><div><dt>Purchase price</dt><dd>Rs. {formatPrice(viewing.purchasePrice)}</dd></div><div><dt>Sale price</dt><dd>Rs. {formatPrice(viewing.salePrice)}</dd></div><div><dt>Current stock</dt><dd>{formatPrice(viewing.stock)} {viewing.unit}</dd></div></dl>
        <button type="button" className="primary" onClick={() => edit(viewing)}><Pencil size={16} /> Edit Product</button>
      </section>
    </div>}
  </>;
}

function ProductStat({ icon: Icon, tone, label, value, note }) {
  return <article className={`product-stat ${tone}`}><span className="product-stat-icon"><Icon size={23} /></span><div><span className="product-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function StockBadge({ product }) {
  const status = stockStatus(product);
  const label = status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock";
  return <span className={`product-stock-badge ${status}`}><i />{label}</span>;
}

function Pagination({ page, pages, setPage }) {
  return <div className="pagination product-pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>;
}