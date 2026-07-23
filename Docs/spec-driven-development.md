# App: La Web del Imperio del Dinero

Here is a comprehensive AI Agent Development Plan written in English. It follows an incremental, feature-by-feature milestone structure—from zero-auth local setup, core entity CRUDs, and transaction engines, all the way to investments, analytics, PWA capabilities, and TUI integration.

## Technical Specifications & Architecture

- Target Deployment Environment: Linux Homelab running Podman (rootless container)
- Backend: Node.js (TypeScript, Fastify or Express)
- Database: SQLite3 (via better-sqlite3 or Kysely / Prisma / Drizzle ORM)
- Frontend: Angular (Latest, standalone components, Signals) + PWA support
- TUI (Terminal User Interface): Node.js script using Blessed / Inquirer consuming the REST API
- Architecture Pattern: Layered architecture (Controllers, Services, Repositories) + OpenAPI / Swagger docs for easy agent testing
- Containerization: The containerization technology used will be Podman

## Development Roadmap & Milestones

Each step is self-contained. Instruct your AI agent to implement and test ONE step at a time.

```
[Phase 1: Core Foundation]  -->  [Phase 2: Transactions]  -->  [Phase 3: Assets]
          │                                  │                        │
          ▼                                  ▼                        ▼
  Users / Accounts / CRUDs          Balance Engine & History    Portfolio & Yields
          │                                  │                        │
          └──────────────────────────────────┴────────────────────────┘
                                             │
                                             ▼
                        [Phase 4: Analytics, PWA & TUI Interface]
```

## Another considerations

- Every labeled text for the user must be in Spanish
- Every variable, table, field or text the user doesn't watch and only the dev team must be in English
- App does NOT need a login nor a password. Everything is open to access to everyone who consumes the app
- If needed to make database changes, use Knex.js migrations
- Do not write files like package.json. Instead run the commands like the npm initializacion or the corresponding installing dependencies commands.

## Step 1: Project Setup & Database Schema Base

Goal: Establish the repository structure, Docker/Podman configuration, SQLite connection, and initial database migrations.

- Tasks:
  - Initialize a Node.js TypeScript workspace with Docker/Podman containerization support (Dockerfile, docker-compose.yml or Podman setup).
  - Set up SQLite connection using a lightweight ORM/query builder (better-sqlite3 + Drizzle or Kysely).
  - Define base schema migrations for non-authenticated domain entities:
    - users: id, name, created_at
    - institutions: id, name, icon
    - accounts: id, user_id, institution_id, name, type (DEBIT, CREDIT, INVESTMENT, CASH), currency, created_at
  - Implement health check endpoint GET /api/health.

## Step 2: Core Domain CRUDs (No Auth)

Goal: Provide full management capabilities for Users, Institutions, and Financial Accounts via REST endpoints and Angular UI.

- Backend Tasks:
  - Implement REST API endpoints:
    - GET / POST / PUT / DELETE for /api/users
    - GET / POST / PUT / DELETE for /api/institutions
    - GET / POST / PUT / DELETE for /api/accounts (filterable by user_id, institution_id, and type).
  - Seed initial default data (Users: Papá, Mamá, Hermano, Yo; Institutions: BBVA, Openbank, Santander, GBM, Cash).
- Frontend Tasks (Angular):
  - Setup Angular app structure with basic navigation (Navigation drawer / sidebar).
  - Build management views for People (Add/Edit Users).
  - Build management views for Institutions & Accounts (Add/Edit Accounts linked to a Person and Institution).

## Step 3: Cashflow Engine & Regular Transactions

Goal: Enable recording income, expenses, and internal transfers between accounts, including real-time balance calculations.

- Database Schema Updates:
  - categories: id, name, type (INCOME, EXPENSE, TRANSFER)
  - transactions: id, account_id, category_id, amount (signed value or type-based), date, description, destination_account_id (optional for transfers).
- Backend Tasks:
  - Implement POST /api/transactions supporting three transaction modes:
    - Income / Expense: Affects account_id balance.
    - Transfer: Atomically deducts from account_id and adds to destination_account_id.
  - Implement GET /api/transactions with flexible query filters:
    - By date range (from, to).
    - By user_id, account_id, type, category_id.
  - Implement calculated balance endpoints: GET /api/accounts/:id/balance (calculating net historical balance vs. period net flow).
- Frontend Tasks:
  - Create a Transaction Entry Form (quick add for income/expense/transfer).
  - Create a Transaction History Ledger View (data table with server-side filters by user, account, date range, or credit card type).

## Step 4: Revaluation & Investment Portfolio Engine (Assets)

Goal: Track yield accounts (e.g., Openbank Vault) and market assets (e.g., NVIDIA on GBM/Plata) through holdings and snapshots.

- Database Schema Updates:
  - assets: id, ticker, name, asset_type (STOCK, ETF, BOND, CRYPTO)
  - asset_holdings: id, account_id, asset_id, quantity, avg_buy_price
  - asset_transactions: id, account_id, asset_id, transaction_type (BUY, SELL), quantity, price_per_unit, fee, date
  - account_revaluations: id, account_id, new_balance, difference, date, notes
- Backend Tasks:
  - Implement Revaluation Endpoint (POST /api/accounts/:id/revaluate): Calculates difference between recorded balance and new balance, auto-generating a YIELD transaction.
  - Implement Asset Holdings Engine:
    - Endpoints to record Buy/Sell orders (POST /api/assets/trade).
    - Auto-recalculate average buy price (avg_buy_price) and current stock count per account.
  - Endpoint GET /api/portfolio/summary: Aggregates total asset holdings across accounts (e.g., total shares of NVDA owned by a user across all brokers).
- Frontend Tasks:
  - Add an Investments & Yields Dashboard:
    - Module to trigger manual balance revaluations (e.g., updating Openbank Vault current balance).
    - Portfolio view displaying asset holdings aggregated by ticker, account, or person.

## Step 5: Advanced Filtering, Period Analytics & Visual Dashboards

Goal: Deliver deep financial insights using period-based historical accumulation logic and interactive charts.

- Backend Tasks:
  - Build period analytics aggregation logic:
    - Historical balance up to start date ($T_{\text{start}}$)
    - Period net flow ($T_{\text{start}}$ to $T_{\text{end}}$)
    - Ending balance ($T_{\text{end}}$)
  - Implement GET /api/analytics/summary endpoint returning income vs. expense breakdowns, top categories, and trend lines over time.
- Frontend Tasks:
  - Integrate a charting library (e.g., Chart.js, ECharts, or ApexCharts).
  - Create the Main Dashboard:
    - Historical cumulative balance toggle ("Include past history in period" vs. "Period-isolated view").
    - Income vs. Expense bar charts.
    - Category breakdown donut charts.
    - Custom grouping toggles (e.g., filter all Credit Cards regardless of bank, or view brother's cash-only activity).

## Step 6: PWA Integration & Terminal UI (TUI)

Goal: Turn the web client into a mobile-installable Progressive Web App (PWA) and build a lightweight terminal client for quick CLI management.

- PWA Tasks (Angular):
  - Add @angular/pwa service worker and manifest configuration.
  - Configure offline shell, app icons, and caching strategy for static assets.
  - Optimize layout for mobile responsiveness (touch-friendly tables and quick add forms).
- TUI Tasks (Node.js CLI):
  - Create a secondary CLI script (/tui/index.js) using libraries like blessed / blessed-contrib or ink.
  - Connect the TUI directly to the local backend REST API (http://localhost:3000/api).
  - Features to implement in TUI:
    - ASCII/Unicode summary dashboard table.
    - Keyboard-driven navigation to add quick transactions.
    - Terminal chart rendering for monthly spend trends.

## Step 7: Containerization & Homelab Deployment

Goal: Package the entire application for production execution in a rootless Podman environment.

- Tasks:
  - Create multi-stage Dockerfile (building Angular frontend and Node.js backend into a single unified container or separate service containers).
  - Configure volume persistence for the SQLite database file (/var/lib/finance-app/data.db).
  - Write podman-compose.yml or standard podman run deployment scripts with restart policies for your Homelab server.
  - Perform end-to-end verification across web, mobile PWA, and SSH/TUI sessions.