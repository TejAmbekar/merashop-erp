import { useERP } from "../context/ERPContext";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchaseHistory() {
  const { purchases, products } = useERP();
  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Purchase History</h2>
          <p>Review all purchase records, suppliers, and transaction totals.</p>
        </div>
      </div>

      <div className="panel">
        {!purchases.length ? (
          <div className="empty">No purchase records yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.supplier}</td>
                    <td>{purchase.date}</td>
                    <td>
                      {purchase.items.length ? (
                        <div className="stacked-list">
                          {purchase.items.map((item, index) => {
                            const product = productMap[item.productId];
                            const label = product ? product.name : `Product #${item.productId}`;
                            return (
                              <span key={`${purchase.id}-${item.productId}-${index}`}>
                                {label} · {Number(item.qty).toLocaleString("en-IN")} {item.unit}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td>{money(purchase.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
