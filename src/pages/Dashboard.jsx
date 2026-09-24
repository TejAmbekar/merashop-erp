import { IndianRupee, ShoppingBag, Package, TrendingUp, Search, Bell, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useERP } from "../context/ERPContext";

export default function Dashboard() {
  const { products, sales, payLater, totalSales, totalPurchases, profit } = useERP();
  const stockValue = products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.purchasePrice || 0), 0);
  const lowStockProducts = products.filter((product) => product.stock <= 5).slice(0, 3);
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const today = new Date();
  const monthlySales = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const total = sales.reduce((sum, sale) => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === monthDate.getFullYear() && saleDate.getMonth() === monthDate.getMonth()
        ? sum + Number(sale.total || 0)
        : sum;
    }, 0);
    return {
      label: monthDate.toLocaleDateString("en-IN", { month: "short" }),
      total
    };
  });
  const highestMonthlySales = Math.max(...monthlySales.map((month) => month.total), 1);
  const dueSoon = payLater.filter((sale) => {
    const due = new Date(`${sale.dueDate}T00:00:00`);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 5);
    return sale.dueDate && due <= limit;
  }).slice(0, 3);

  const cards = [
    ["Purchase", totalPurchases, "#2563eb", ShoppingBag],
    ["Sales", totalSales, "#16a34a", IndianRupee],
    ["Stock Value", stockValue, "#7c3aed", Package],
    ["Profit", profit, "#ea580c", TrendingUp]
  ];

  const showIndependenceBanner = today.getMonth() === 7 && today.getDate() <= 15;

  return (
    <>
      <div className="page-title">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your shop operations.</p>
        </div>
      </div>

      <section className="inventory-overview-panel">
        <div className="inventory-panel-header">
          <div className="window-title"><ShieldCheck size={16} /> Inventory Overview</div>
          <div className="window-tools">
            <Search size={14} />
            <Bell size={14} />
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div className="overview-metrics">
          <div className="overview-metric metric-total">
            <label>Total Products:</label>
            <strong>{products.length}</strong>
          </div>
          <div className="overview-metric metric-stock">
            <label>In Stock</label>
            <strong>{totalStock.toLocaleString("en-IN")}</strong>
          </div>
          <div className="overview-metric metric-alert">
            <label>Buying Alerts</label>
            <strong>{lowStockProducts.length}</strong>
          </div>
        </div>

        <div className="inventory-content-grid">
          <div className="mini-panel low-stock-panel">
            <h3>Low Stock Alert!</h3>
            {lowStockProducts.length ? (
              lowStockProducts.map((product) => (
                <div className="alert-item" key={product.id}>
                  <span className="alert-pill danger">!</span>
                  <div>
                    <label>{product.name}</label>
                    <strong>{product.stock} left</strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">No low-stock products</div>
            )}
          </div>

          <div className="mini-panel sales-panel">
            <h3>Sales Summary</h3>
            <div className="sales-bars" aria-label="Sales summary chart">
              {monthlySales.map((month, index) => (
                <div className="bar-col" key={`${month.label}-${index}`}>
                  <span
                    className={index % 2 === 0 ? "bar blue" : "bar sky"}
                    style={{ height: `${Math.max((month.total / highestMonthlySales) * 100, month.total ? 8 : 0)}%` }}
                    title={`₹${month.total.toLocaleString("en-IN")}`}
                  />
                  <small>{month.label}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showIndependenceBanner && (
        <div className="independence-banner">
          <div className="banner-content">
            <span className="banner-badge">🇮🇳 Independence Day</span>
            <h3>Celebrate freedom, growth, and new beginnings.</h3>
          </div>
          <div className="banner-flag" aria-hidden="true">
            <span className="flag-saffron" />
            <span className="flag-white" />
            <span className="flag-green" />
          </div>
        </div>
      )}

      <div className="cards">
        {cards.map(([label, value, color, Icon]) => (
          <div className="card" key={label}>
            <div className="card-icon" style={{ background: color }}>
              <Icon />
            </div>
            <div>
              <span>{label}</span>
              <strong>₹{value.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Recent Sales</h3>
          {sales.slice(0, 6).map((sale) => (
            <div className="row" key={sale.id}>
              <span>{sale.customer}</span>
              <b>₹{sale.total.toLocaleString("en-IN")}</b>
            </div>
          ))}
          {!sales.length && <Empty />}
        </div>

        <div className="panel">
          <h3>Payment Due Soon</h3>
          {dueSoon.map((sale) => (
            <div className="row" key={sale.id}>
              <span>{sale.customer}<small className="row-subtext">Due {sale.dueDate}</small></span>
              <b className="danger">₹{sale.remainingAmount.toLocaleString("en-IN")}</b>
            </div>
          ))}
          {!dueSoon.length && <Empty text="No payments due in the next 5 days" />}
        </div>
      </div>
    </>
  );
}

function Empty({ text = "No transactions yet" }) {
  return <div className="empty">{text}</div>;
}