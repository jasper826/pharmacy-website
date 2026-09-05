# Kana Drug Store Web Application

Kana Drug Store is a full-stack pharmacy web application for **Kana Drug Store** in Arba Minch, Ethiopia (established November 21, 2016; operating 24/7 in front of Arba Minch General Hospital and near Referral Hospital). It provides patient medicine search, interactive shopping cart, prescription document upload, wholesale quotation requests, pharmacist review dashboard, and user authentication.

---

## 🌟 Key Features

- **Medicines Catalog & Live Search**: Filter medications across 8 clinical categories with dynamic debounced search.
- **Shopping Cart & Checkout**: Add/remove medications, adjust quantities, calculate totals in ETB, and place orders with flexible payment methods (Cash on Delivery, Telebirr, CBE Birr).
- **24/7 Emergency & B2B Wholesale**: Direct emergency call triggers (`0922142311`) and hospital/clinic wholesale inquiry submissions.
- **Prescription Upload**: Secure patient upload of prescription images (JPG, PNG, WEBP) and PDF documents.
- **Pharmacist Review Dashboard**: Real-time review interface for pharmacists to view uploaded prescriptions and update fulfillment statuses.
- **User Authentication**: Secure JWT-based registration and login with bcrypt password hashing.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js 5.x
- **Database**: MongoDB & Mongoose 9.x
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **File Handling**: `multer`
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Edition or MongoDB Atlas cluster)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your settings:
```bash
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kana_drug_store
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Seed Medicines Database (Optional)
Populate the database with sample clinical medicines:
```bash
npm run seed
```

### 5. Start Application
```bash
npm start
```
Open **`http://localhost:5000`** in your browser.

---

## 📡 API Endpoints

### Health
- `GET /api/health` - Service health status

### Authentication
- `POST /api/auth/register` - Register a new user (`fullName`, `email`, `phone`, `password`)
- `POST /api/auth/login` - Authenticate user (`email`, `password`)
- `GET /api/auth/me` - Get current user profile (Requires Bearer token)

### Medicines
- `GET /api/medicines` - Fetch catalog (Query params: `?search=...&category=...`)
- `GET /api/medicines/:id` - Fetch single medicine details
- `POST /api/medicines` - Add new medicine (Admin)

### Orders
- `POST /api/orders` - Place checkout order (`items`, `customerName`, `phone`, `deliveryAddress`, `paymentMethod`)
- `GET /api/orders` - Retrieve all orders
- `PATCH /api/orders/:id/status` - Update order status (`Pending`, `Processing`, `Delivered`, `Cancelled`)

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription file with patient details
- `GET /api/prescriptions` - List all submitted prescriptions
- `PATCH /api/prescriptions/:id/status` - Update review status (`Pending`, `Reviewed`, `Approved`, `Fulfilled`, `Rejected`)

---

## ☁️ Deployment Guide

### Deploying to Render
1. Push this repository to GitHub.
2. Log into [Render](https://render.com) and click **New Web Service**.
3. Select this repository.
4. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
5. Add `MONGO_URI` (from MongoDB Atlas) and `JWT_SECRET` in Environment Variables.

### Deploying with Docker
```bash
docker build -t kana-drug-store .
docker run -p 5000:5000 -e MONGO_URI="mongodb+srv://..." -e JWT_SECRET="..." kana-drug-store
```

---

## 📄 License
MIT License
