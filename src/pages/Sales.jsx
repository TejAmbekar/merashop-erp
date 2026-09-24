import { useState } from "react";
import jsPDF from "jspdf";
import { useERP } from "../context/ERPContext";

const today = () => new Date().toISOString().slice(0, 10);
const money = value => `Rs. ${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const upiId = import.meta.env.VITE_UPI_ID || "";
const upiName = import.meta.env.VITE_UPI_NAME || "Mera SHOP";
const upiPaymentUrl = amount => { const params = new URLSearchParams({ pa: upiId, pn: upiName, am: Number(amount).toFixed(2), cu: "INR" }); return `upi://pay?${params.toString()}`; };
const qrImageUrl = amount => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPaymentUrl(amount))}`;

export default function Sales() {
  const { products, addSale } = useERP();
  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState(today());
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [dueDate, setDueDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [items, setItems] = useState([{ productId: products[0]?.id || "", qty: 1, price: products[0]?.salePrice || 0 }]);
  const product = id => products.find(item => item.id === Number(id));
  const total = items.reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);
  const collected = paymentMode === "partial" ? Number(paidAmount || 0) : total;
  const remaining = Math.max(total - collected, 0);
  const showUpiQr = paymentMode === "upi" || (paymentMode === "partial" && paymentMethod === "upi");
  const updateItem = (index, key, value) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const selectProduct = (index, value) => { const selected = product(value); setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, productId: value, price: selected?.salePrice || 0 } : item)); };
  const addItem = () => setItems(current => [...current, { productId: products[0]?.id || "", qty: 1, price: products[0]?.salePrice || 0 }]);

  const loadLogo = () => new Promise(resolve => { const image = new Image(); image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = 800; canvas.height = 300; canvas.getContext("2d").drawImage(image, 0, 0, 800, 300); resolve(canvas.toDataURL("image/png")); }; image.onerror = () => resolve(null); image.src = "/logo.svg"; });

  const generateBill = async sale => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 36;
    const green = [29, 112, 24];
    const logo = await loadLogo();
    doc.setDrawColor(...green); doc.setLineWidth(1.2); doc.roundedRect(10, 10, width - 20, height - 20, 3, 3, "S");
    if (logo) doc.addImage(logo, "PNG", (width - 270) / 2, 24, 270, 101);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...green); doc.text("SALES RECEIPT", width - margin, 48, { align: "right" }); doc.line(margin, 140, width - margin, 140);
    doc.setFontSize(11); doc.setTextColor(20, 25, 20); doc.text("Customer:", margin, 174); doc.text("Mobile:", margin, 198); doc.text("Date:", width - 170, 174);
    doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 55); doc.text(sale.customer, margin + 70, 174); doc.text(sale.mobile, margin + 70, 198); doc.text(sale.date, width - 112, 174);
    const tableTop = 232; const columns = [margin, margin + 270, margin + 350, margin + 448, width - margin];
    doc.setFillColor(...green); doc.rect(margin, tableTop, width - margin * 2, 30, "F"); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255); doc.text("ITEM", columns[0] + 12, tableTop + 20); doc.text("QTY", columns[1] + 28, tableTop + 20); doc.text("PRICE", columns[2] + 16, tableTop + 20); doc.text("TOTAL", columns[3] + 22, tableTop + 20);
    let y = tableTop + 30;
    sale.items.forEach((item, index) => { const selected = product(item.productId); if (index % 2 === 0) { doc.setFillColor(242, 248, 236); doc.rect(margin, y, width - margin * 2, 34, "F"); } doc.setTextColor(25, 30, 25); doc.text(`${index + 1}. ${selected?.name || "Product"}`, columns[0] + 12, y + 21); doc.text(`${item.qty} ${selected?.unit || "Piece"}`, columns[1] + 12, y + 21); doc.text(money(item.price), columns[2] + 12, y + 21); doc.text(money(Number(item.qty) * Number(item.price)), columns[4] - 12, y + 21, { align: "right" }); y += 34; });
    doc.setDrawColor(150, 185, 145); doc.roundedRect(margin, y + 18, width - margin * 2, 78, 7, 7, "S"); doc.setFont("times", "italic"); doc.setFontSize(22); doc.setTextColor(...green); doc.text("Thank You!", margin + 78, y + 53, { align: "center" }); const totalX = width - margin - 270; doc.setFillColor(...green); doc.roundedRect(totalX, y + 34, 125, 46, 6, 6, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Grand Total", totalX + 62, y + 62, { align: "center" }); doc.setTextColor(...green); doc.setFontSize(16); doc.text(money(sale.total), totalX + 257, y + 62, { align: "right" }); doc.setFillColor(...green); doc.rect(10, height - 45, width - 20, 35, "F"); doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text("Thank you for shopping with us!", width / 2, height - 24, { align: "center" });
    if (sale.paymentMode === "partial") { doc.setFontSize(10); doc.setTextColor(29, 112, 24); doc.text(`Current Payment: ${money(sale.paidAmount)}`, margin, height - 82); doc.text(`Remaining Payment: ${money(Math.max(Number(sale.total) - Number(sale.paidAmount), 0))}`, margin + 150, height - 82); doc.text(`Payment Due Date: ${sale.dueDate || "-"}`, margin + 330, height - 82); }
    doc.save(`bill-${sale.customer.toLowerCase().replace(/\s+/g, "-")}-${sale.date}.pdf`);
  };

  const save = async event => { event.preventDefault(); if (!customer.trim()) return alert("Enter customer name"); if (!/^\d{10}$/.test(mobile)) return alert("Enter a valid 10-digit mobile number"); if (showUpiQr && !upiId) return alert("Set VITE_UPI_ID in your .env file before accepting UPI payments."); if (paymentMode === "partial" && collected > total) return alert("Paid amount cannot exceed the total"); if (paymentMode === "partial" && remaining > 0 && !dueDate) return alert("Enter a due date for the remaining payment"); for (const item of items) { const selected = product(item.productId); if (!selected) return alert("Select a valid product"); if (Number(item.qty) > selected.stock) return alert(`${selected.name}: only ${selected.stock} ${selected.unit} available`); } const sale = { customer: customer.trim(), mobile, date, items: items.map(item => ({ ...item, productId: Number(item.productId), qty: Number(item.qty), price: Number(item.price) })), total, paymentMode, paidAmount: collected, paymentMethod, dueDate: remaining ? dueDate : undefined, paymentNotes }; try { await addSale(sale); await generateBill(sale); alert("Sale completed and bill PDF downloaded."); window.location.reload(); } catch (error) { alert(error.message || "Sale saved, but the bill could not be generated."); } };

  return <><Page title="Sale" sub="Create a customer bill and automatically deduct sold quantity from inventory." /><form className="panel sale-form" onSubmit={save}><div className="form-grid"><label>Customer Name<input value={customer} onChange={event => setCustomer(event.target.value)} placeholder="Customer name" required /></label><label>Mobile Number<input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={mobile} onChange={event => setMobile(event.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile number" required /></label><label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label></div><h3>Sale Items</h3><div className="table-wrap"><table><thead><tr><th>Product</th><th>Available Qty</th><th>Sale Qty</th><th>Price</th><th>Total</th><th /></tr></thead><tbody>{items.map((item, index) => { const selected = product(item.productId); return <tr key={index}><td><select value={item.productId} onChange={event => selectProduct(index, event.target.value)}>{products.map(option => <option value={option.id} key={option.id}>{option.name}</option>)}</select></td><td><span className={selected?.stock <= 5 ? "danger" : ""}>{selected?.stock || 0} {selected?.unit}</span></td><td><input type="number" min="1" max={selected?.stock || 1} value={item.qty} onChange={event => updateItem(index, "qty", event.target.value)} /></td><td><input type="number" min="0" value={item.price} onChange={event => updateItem(index, "price", event.target.value)} /></td><td>Rs. {(Number(item.qty) * Number(item.price)).toLocaleString("en-IN")}</td><td><button type="button" className="icon-btn" aria-label="Remove item" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}>x</button></td></tr>; })}</tbody></table></div><button type="button" className="secondary" onClick={addItem}>+ Add Item</button><div className="bill-summary"><div><span>Grand Total</span><strong>Rs. {total.toLocaleString("en-IN")}</strong></div></div><section className="payment-section"><h3>Payment</h3><div className="payment-mode"><label><input type="radio" name="paymentMode" value="cash" checked={paymentMode === "cash"} onChange={() => setPaymentMode("cash")} /> Cash</label><label><input type="radio" name="paymentMode" value="upi" checked={paymentMode === "upi"} onChange={() => setPaymentMode("upi")} /> UPI</label><label><input type="radio" name="paymentMode" value="partial" checked={paymentMode === "partial"} onChange={() => setPaymentMode("partial")} /> Partial Payment / Pay Later</label></div>{showUpiQr && <div className="upi-payment">{upiId ? <img src={qrImageUrl(paymentMode === "partial" ? collected : total)} alt={`UPI payment QR code for Rs. ${paymentMode === "partial" ? collected.toFixed(2) : total.toFixed(2)}`} /> : <div><strong>UPI QR is not configured</strong><small>Set VITE_UPI_ID in your .env file and restart Vite.</small></div>}<div><strong>Scan to pay</strong><span>Amount: Rs. {(paymentMode === "partial" ? collected : total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span><small>Confirm payment in your UPI app before completing the sale.</small></div></div>}{paymentMode === "partial" && <div className="partial-payment"><label>Current Payment<input type="number" min="0" max={total} step="0.01" value={paidAmount} onChange={event => setPaidAmount(event.target.value)} required /></label><label>Collected Via<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option></select></label><label>Remaining Payment Due<input type="text" value={`Rs. ${remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} readOnly /></label><label>Due Date<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} required={remaining > 0} /></label><label>Notes<input value={paymentNotes} onChange={event => setPaymentNotes(event.target.value)} placeholder="Optional note" /></label></div>}</section><button className="primary">Complete Sale &amp; Generate Bill</button></form></>;
}

function Page({ title, sub }) { return <div className="page-title"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
