CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
  sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price >= 0),
  stock NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit TEXT NOT NULL DEFAULT 'Piece',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  supplier TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  customer TEXT NOT NULL,
  mobile TEXT NOT NULL,
  sale_date DATE NOT NULL,
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  profit NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_notes TEXT;
UPDATE sales SET paid_amount = total WHERE paid_amount = 0 AND payment_status = 'paid';

CREATE TABLE IF NOT EXISTS pay_later_payments (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi')),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  qty NUMERIC(12, 3) NOT NULL CHECK (qty > 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
  line_profit NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS purchase_items_product_idx ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS sale_items_product_idx ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(sale_date);
CREATE INDEX IF NOT EXISTS pay_later_payments_sale_idx ON pay_later_payments(sale_id);

INSERT INTO products (name, sku, purchase_price, sale_price, stock, unit) VALUES
  ('Rice 25kg', 'RICE25', 1100, 1350, 20, 'Bag'),
  ('Wheat 10kg', 'WHEAT10', 520, 650, 35, 'Bag'),
  ('Sugar 5kg', 'SUGAR5', 230, 290, 50, 'Pack')
ON CONFLICT (sku) DO NOTHING;
