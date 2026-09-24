# Mera SHOP ERP

React + Vite frontend with an Express REST API and PostgreSQL database for Purchase, Sale, Profit and Inventory Management.

## Run in VS Code

```bash
npm install
copy .env.example .env
docker compose up -d postgres
```

Start the API and frontend in separate terminals:

```bash
npm run server:dev
npm run dev
```

Open the local URL shown by Vite, normally http://localhost:5173/

## Main logic

- Purchase increases product stock.
- Sale automatically displays current available stock.
- Sale quantity cannot exceed available stock.
- Completing a sale decreases inventory.
- Profit = sale price - purchase price, multiplied by sold quantity.
- Data is persisted in PostgreSQL. The API creates its tables and seeds the starter products on first start.
- Purchase, Sale, Inventory, Products and Profit pages are included.

## Backend

- `GET /api/health` checks database connectivity.
- Products, purchases and sales have REST endpoints under `/api`.
- Purchase and sale stock changes run in database transactions with row locks, preventing overselling during concurrent requests.
- Request bodies are validated with Zod and common security middleware is enabled.
- Set `REQUIRE_AUTH=true` to require JWT authentication. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server, then use `POST /api/auth/login` to obtain a token.
- The web app opens with a login screen. Use the `ADMIN_EMAIL` value as the username and the `ADMIN_PASSWORD` value as the password. Restart the API after changing `.env`.
- For production, replace the Compose credentials, use a managed PostgreSQL instance, set a strong `JWT_SECRET`, and set `CLIENT_ORIGIN` to the deployed frontend origin.

## Bill

The Sale page contains a proper bill-style summary with customer, date, line items, subtotal, profit and grand total. PDF generation remains in the frontend; all sale and inventory data is persisted by the backend.
