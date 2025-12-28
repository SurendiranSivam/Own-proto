# 3D Printing Solutions Management

A comprehensive web application for managing a 3D printing solutions business, including inventory tracking, order management, procurement, and financial reporting.

## 🚀 Features

- **Dashboard** - Real-time overview of business metrics
- **Inventory Management** - Track filaments, stock levels, and low-stock alerts
- **Order Management** - Customer orders with payment tracking
- **Vendor Management** - Supplier information and contacts
- **Procurement** - Track material purchases and deliveries
- **Print Usage** - Log material consumption per job
- **Payment Tracking** - Monitor receivables and revenue
- **CSV Exports** - Export reports for all modules

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **API**: RESTful architecture

## 📁 Project Structure

```
3d-printing-business/
├── config/
│   └── supabase.js       # Supabase client configuration
├── models/
│   ├── vendor.js         # Vendor CRUD operations
│   ├── filament.js       # Filament/inventory operations
│   ├── order.js          # Order management
│   ├── payment.js        # Payment tracking
│   ├── procurement.js    # Procurement management
│   ├── printUsage.js     # Material usage logging
│   └── dashboard.js      # Dashboard statistics
├── routes/
│   ├── vendors.js        # /api/vendors
│   ├── inventory.js      # /api/inventory
│   ├── orders.js         # /api/orders
│   ├── payments.js       # /api/payments
│   ├── procurement.js    # /api/procurement
│   ├── printUsage.js     # /api/print-usage
│   ├── dashboard.js      # /api/dashboard
│   └── exports.js        # /api/exports
├── public/
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/               # Frontend JavaScript
│   ├── index.html        # Landing page
│   ├── dashboard.html    # Main dashboard
│   ├── vendors.html      # Vendor management
│   ├── inventory.html    # Inventory management
│   ├── orders.html       # Order management
│   ├── payments.html     # Payment tracking
│   ├── procurement.html  # Procurement management
│   ├── print-usage.html  # Print usage logging
│   └── exports.html      # Export reports
├── .env                  # Environment variables (not in git)
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
├── server.js             # Express server entry point
└── README.md             # This file
```

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3d-printing-business
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   
   Create a `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Create database tables**
   
   Run the SQL schema in Supabase SQL Editor (see `docs/schema.sql`)

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open the app**
   
   Navigate to http://localhost:3000

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET/POST /api/vendors` | Vendor CRUD |
| `GET/POST /api/inventory` | Filament inventory |
| `GET/POST /api/orders` | Order management |
| `GET/POST /api/payments` | Payment tracking |
| `GET/POST /api/procurement` | Procurement tracking |
| `GET/POST /api/print-usage` | Print usage logging |
| `GET /api/dashboard/stats` | Dashboard statistics |
| `GET /api/exports/*` | CSV exports |

## 📊 Database Schema

The application uses 6 main tables:
- `vendors` - Supplier information
- `filaments` - Inventory items
- `orders` - Customer orders
- `payments` - Payment records
- `procurement` - Material purchases
- `print_usage` - Material consumption logs

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## 📝 License

ISC

## 👤 Author

Surendiran
