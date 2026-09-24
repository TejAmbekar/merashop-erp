import { Fragment, useState } from "react";
import { useERP } from "../context/ERPContext";

export default function Profit() {
  const { sales, profit, totalSales, products } = useERP();
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const visibleSales = sales.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(sales.length / pageSize));

  const getProduct = (id) => products.find((p) => p.id === Number(id));

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Profit After Sale</h2>
          <p>Profit is calculated using sale price minus purchase price.</p>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div>
            <span>Total Sales</span>
            <strong>₹{totalSales.toLocaleString("en-IN")}</strong>
          </div>
        </div>
        <div className="card">
          <div>
            <span>Total Profit</span>
            <strong className="success">₹{profit.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Sales Profit Details</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Bill Total</th>
                <th>Profit</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((s) => {
                const isOpen = expandedSaleId === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr>
                      <td>{s.date}</td>
                      <td>{s.customer}</td>
                      <td>₹{Number(s.total || 0).toLocaleString("en-IN")}</td>
                      <td className="success">₹{Number(s.profit || 0).toLocaleString("en-IN")}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setExpandedSaleId(isOpen ? null : s.id)}
                        >
                          {isOpen ? "Hide" : "Customer Details"}
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                            <strong style={{ display: "block", marginBottom: "10px" }}>{s.customer} purchased:</strong>
                            {s.items.map((item, index) => {
                              const product = getProduct(item.productId);
                              const lineTotal = Number(item.qty) * Number(item.price);
                              return (
                                <div
                                  key={`${s.id}-${index}`}
                                  style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}
                                >
                                  <span>
                                    {index + 1}. {product?.name || "Unknown Product"} ({item.qty} {product?.unit || "unit"})
                                  </span>
                                  <span>₹{lineTotal.toLocaleString("en-IN")}</span>
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontWeight: 700 }}>
                              <span>Total</span>
                              <span>₹{Number(s.total || 0).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination"><button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div>
      </div>
    </>
  );
}
