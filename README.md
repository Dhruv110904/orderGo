# orderGo - Inventory and Order Management System

`orderGo` is a complete, production-ready full-stack **Inventory and Order Management System** built with **Next.js 14 (App Router)**, **Neon PostgreSQL**, **Tailwind CSS**, and **Drizzle ORM**. It features robust role-based authentication (Admin vs. Seller), high-precision financial/scientific computations using `numeric(20,6)` database mappings, automatic unit conversions, and transactional inventory safety guards.

---

## 1. Features

### Admin Capabilities
* **Global Dashboard**: View total revenue, pending queue count, active catalog count, low stock alarms, and a feed of recent transactions.
* **Product Catalog CRUD**: Manage items, configure SKUs, set categories, and specify base storage units. Includes a live bulk-price conversion helper.
* **Order Fulfilment**: View itemized seller submissions (including both ordered units and base warehouse quantities), notes, and update statuses (Confirm, Reject, Fulfill) with automatic stock reservation or restoration.
* **Sellers Directory**: Manage authorized sales staff and register new logins.

### Seller Capabilities
* **Seller Dashboard**: Track purchase totals, pending quotation counts, and browse recent orders.
* **Product Catalog Browser**: Search, filter by category/unit, choose display units (e.g. `kg` or `L`), view live price math, and add products to the cart.
* **Shopping Cart**: Manage quantities, change units on the fly, add special order notes, check stock warnings, and submit orders/quotations.
* **Order History**: Track previous request logs, check admin decisions, and view itemized bills.

---

## 2. Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React framework supporting server/client hybrid rendering. |
| **Database** | Neon PostgreSQL | Serverless relational database for modern applications. |
| **ORM** | Drizzle ORM | TypeScript-first ORM with migrations CLI (`drizzle-kit`). |
| **Auth** | NextAuth.js v5 (Beta) | Password authentication via CredentialsProvider & JWT sessions. |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive dark-themed styling with premium layout. |
| **Language** | TypeScript | Type safety throughout all routes and UI components. |

---

## 3. System Design Diagram

```
                 +-----------------------------------+
                 |           Next.js App             |
                 | (Pages, Client Components, Forms) |
                 +-----------------+-----------------+
                                   |
                     Fetches data / Submits Forms
                                   |
                                   v
                 +-----------------+-----------------+
                 |        API Routes & Actions       |
                 |    (Zod Validation, Auth Guard,   |
                 |     lib/units.ts conversion)      |
                 +-----------------+-----------------+
                                   |
                        Drizzle ORM Queries
                                   |
                                   v
                 +-----------------+-----------------+
                 |      Neon serverless Postgres     |
                 |   (Transaction logs, stock checks)|
                 +-----------------------------------+
```

---

## 4. Database Schema

Drizzle ORM maps the database tables in [db/schema.ts](file:///d:/orderGo/db/schema.ts):

### `users`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `name`: `varchar(255) NOT NULL`
* `email`: `varchar(255) UNIQUE NOT NULL`
* `password_hash`: `text NOT NULL`
* `role`: `varchar(20) NOT NULL` (Check Constraint: `role IN ('admin', 'seller')`)
* `created_at`: `timestamptz DEFAULT now()`

### `products`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `name`: `varchar(255) NOT NULL`
* `sku`: `varchar(100) UNIQUE NOT NULL`
* `description`: `text`
* `category`: `varchar(100)`
* `base_unit`: `varchar(10) NOT NULL` (Check Constraint: `base_unit IN ('g', 'mL', 'unit')`)
* `base_price_per_unit`: `numeric(20,6) NOT NULL` (Price in INR per base unit)
* `stock_quantity`: `numeric(20,6) NOT NULL DEFAULT 0` (Stored in base unit)
* `is_active`: `boolean DEFAULT true`
* `created_at`: `timestamptz DEFAULT now()`
* `updated_at`: `timestamptz DEFAULT now()`

### `orders`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `user_id`: `uuid REFERENCES users(id)`
* `status`: `varchar(30) DEFAULT 'pending'` (Check Constraint: `status IN ('pending', 'confirmed', 'rejected', 'fulfilled')`)
* `total_amount`: `numeric(20,2) NOT NULL` (Grand total in INR)
* `notes`: `text`
* `created_at`: `timestamptz DEFAULT now()`
* `updated_at`: `timestamptz DEFAULT now()`

### `order_items`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `order_id`: `uuid REFERENCES orders(id) ON DELETE CASCADE`
* `product_id`: `uuid REFERENCES products(id)`
* `ordered_unit`: `varchar(10) NOT NULL` (e.g. `g`, `kg`, `mL`, `L`, `unit`)
* `ordered_quantity`: `numeric(20,6) NOT NULL` (Chosen quantity)
* `base_quantity`: `numeric(20,6) NOT NULL` (Converted to base unit for database storage)
* `unit_price_in_ordered_unit`: `numeric(20,6) NOT NULL` (Price in INR per ordered unit)
* `line_total`: `numeric(20,2) NOT NULL` (Grand line total in INR)

---

## 5. Unit Storage Strategy

To prevent rounding bugs and representation mismatch, all items are saved in their baseline physical dimensions:
* **Weight** is stored in **grams (g)**. 
* **Volume** is stored in **milliliters (mL)**.
* **Countable items** are stored in individual **units (unit)**.

### Conversion Table
* `1 kg = 1000 g`
* `1 L = 1000 mL`
* `1 unit = 1 unit`

### Processing Pipeline
1. All conversions are performed programmatically in the API route `/api/orders` **before** writing values to the database using the utility module [lib/units.ts](file:///d:/orderGo/lib/units.ts).
2. The UI handles displays in the seller-selected unit (`kg` or `L`) by computing them dynamically on the fly (`fromBaseUnit`).
3. Database constraints guarantee that only standard base units are written.

---

## 6. Price Storage Strategy

* **Base Prices** are saved in the `products` table as `numeric(20,6)` in INR per **base unit** (e.g., ₹/g, ₹/mL, ₹/unit).
* **Display Prices** are computed on the fly using:
  `pricePerOrderedUnit = basePricePerBaseUnit * ConversionFactor`
  * *Example*: Rice base price is `₹0.05/g`. In the UI, selecting `kg` shows:
    `₹0.05 * 1000 = ₹50/kg`.
* **Line Totals** and **Order Grand Totals** are saved in `orders` and `order_items` tables as `numeric(20,2)` in INR (rounded to 2 decimal places).

---

## 7. Local Setup Steps

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database Credentials
DATABASE_URL=your-neon-pooled-connection-string
DATABASE_URL_UNPOOLED=your-neon-direct-connection-string

# NextAuth Config
NEXTAUTH_SECRET=a-random-32-character-secret-string
NEXTAUTH_URL=http://localhost:3000
```

### 3. Generate & Run Migrations
Generate SQL migration schemas:
```bash
npm run db:generate
```
Apply migrations to the Neon Postgres database:
```bash
npm run db:migrate
```

### 4. Seed database
Populate initial test profiles and products:
```bash
npm run db:seed
```

### 5. Launch local server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 8. Vercel Deployment

1. Create a new project on [Vercel](https://vercel.com).
2. Link it to your git repository containing this project.
3. Supply the Environment Variables in the Vercel Dashboard Settings:
   * `DATABASE_URL`
   * `DATABASE_URL_UNPOOLED`
   * `NEXTAUTH_SECRET` (generate a unique 32-char secret)
   * `NEXTAUTH_URL` (use your deployment URL)
4. Trigger the deployment. Vercel will automatically build the production assets.

---

## 9. Test Credentials

* **Administrator Profile**
  * Email: `admin@aasa.com`
  * Password: `Admin@123`
* **Seller Profile**
  * Email: `seller@aasa.com`
  * Password: `Seller@123`

---

## 10. Step-by-Step Usage Guide

### Admin Panel
1. Sign in as `admin@aasa.com`. You are redirected to `/admin/dashboard`.
2. **Manage Products**: Click **Products** in the sidebar. You can view, delete, or toggle products active/inactive.
   * Click **Add Product**. Set details (e.g. name, SKU, base price per g). View the live price helper converting to equivalent kg prices. Click Create.
3. **Approve Orders**: Click **Orders** in the sidebar. Select a **Pending** order.
   * Click the **Order Status** dropdown.
   * Choose **Confirm & Reserve Stock**. The system will verify stock availability. If available, the transaction completes, stock decrements, and status updates to Confirmed. If stock is insufficient, a clear warning toast blocks the change.
4. **Manage Users**: Click **Sellers** in the sidebar. Review accounts, or click **Register User** to add new sellers to the system.

### Seller Panel
1. Sign in as `seller@aasa.com`. You are redirected to `/seller/dashboard`.
2. **Browse Catalog**: Click **Product Catalog** in the sidebar.
   * Find Basmati Rice. Select **kg** in the unit dropdown. Set quantity to `2.5`.
   * Review the live pricing details: `2.5 kg × ₹60.00/kg = ₹150.00`.
   * Click **Add to Order Cart**. A dynamic badge updates on the **Shopping Cart** link.
3. **Checkout**: Click **Shopping Cart**.
   * Review items. You can adjust quantities or switch units (e.g. changing `kg` back to `g` re-calculates everything instantly).
   * Enter notes (e.g., "Fragile delivery").
   * Click **Place Order**. You will see an Order Confirmed screen.
4. **Order History**: Click **Order History** in the sidebar to review status transitions from Pending to Confirmed or Fulfilled.
