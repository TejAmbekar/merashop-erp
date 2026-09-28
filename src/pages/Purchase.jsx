import { useState } from "react";
import { useERP } from "../context/ERPContext";

export default function Purchase() {
	const { products, addPurchase } = useERP();
	const [supplier, setSupplier] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [items, setItems] = useState([{ productId: products[0]?.id || "", qty: 1, price: products[0]?.purchasePrice || 0 }]);
	const product = id => products.find(item => item.id === Number(id));
	const change = (index, key, value) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
	const add = () => setItems(current => [...current, { productId: products[0]?.id || "", qty: 1, price: products[0]?.purchasePrice || 0 }]);
	const total = items.reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);
	const save = async event => {
		event.preventDefault();
		if (!supplier || !items.length) return alert("Enter supplier and items");
		try {
			await addPurchase({ supplier, date, items: items.map(item => ({ ...item, productId: Number(item.productId), qty: Number(item.qty), price: Number(item.price) })), total });
			setSupplier("");
			setItems([{ productId: products[0]?.id || "", qty: 1, price: products[0]?.purchasePrice || 0 }]);
		} catch {}
	};

	return <>
		<Page title="Purchase" sub="Purchase products from wholesalers and add them to stock." />
		<form className="panel" onSubmit={save}>
			<div className="form-grid">
				<label>Wholesaler / Supplier<input value={supplier} onChange={event => setSupplier(event.target.value)} placeholder="Supplier name" required /></label>
				<label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
			</div>
			<h3>Purchase Items</h3>
			<div className="table-wrap"><table>
				<thead><tr><th>Product</th><th>Quantity / Unit</th><th>Purchase Price / Unit</th><th>Total</th><th /></tr></thead>
				<tbody>{items.map((item, index) => {
					const selected = product(item.productId);
					return <tr key={index}>
						<td><select value={item.productId} onChange={event => { const nextProduct = product(event.target.value); change(index, "productId", event.target.value); change(index, "price", nextProduct?.purchasePrice || 0); }}>{products.map(option => <option value={option.id} key={option.id}>{option.name}</option>)}</select></td>
						<td><div className="quantity-with-unit"><input type="number" min="0.01" step="0.01" inputMode="decimal" aria-label={`Quantity in ${selected?.unit || "units"}`} value={item.qty} onChange={event => change(index, "qty", event.target.value)} /><span className="quantity-unit">{selected?.unit}</span></div></td>
						<td><input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`Purchase price per ${selected?.unit || "unit"}`} value={item.price} onChange={event => change(index, "price", event.target.value)} /></td>
						<td>₹{(Number(item.qty) * Number(item.price)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
						<td><button type="button" className="icon-btn" aria-label="Remove item" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></td>
					</tr>;
				})}</tbody>
			</table></div>
			<button type="button" className="secondary" onClick={add}>+ Add Item</button>
			<div className="total-box"><span>Grand Total</span><strong>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
			<button className="primary">Save Purchase</button>
		</form>
	</>;
}

function Page({ title, sub }) { return <div className="page-title"><div><h2>{title}</h2><p>{sub}</p></div></div>; }