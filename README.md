# 🛍️ ShopWave — Full-Stack E-Commerce Platform

ShopWave is a full-stack fashion and lifestyle e-commerce application built with **React, Node.js, Express.js, TypeScript, Prisma ORM, and PostgreSQL**.

The project is designed with a production-oriented architecture where the frontend and backend are deployed independently. The frontend is hosted on **Vercel**, the backend on **Render**, and the application database is hosted on **Neon PostgreSQL**.

## 🌐 Live Application

**Frontend:**
https://shopwave-new.vercel.app/

**Backend API:**
https://shopwave-new.onrender.com

**GitHub Repository:**
https://github.com/sravankumar27319/shopwave-new

---

# ✨ Features

## 👤 Authentication

* User registration
* User login
* Email and password authentication
* Password hashing using `bcryptjs`
* JWT-based authentication
* Short-lived access tokens
* Refresh-token based authentication
* Refresh tokens stored using HTTP-only cookies
* Authentication context on the frontend
* Protected frontend routes
* Authenticated user state management
* Customer/Admin role support in the backend architecture

---

# 🛒 E-Commerce Features

### Product Management

* Product listing
* Product details
* Product categories
* Product images
* Product pricing
* Original price / discounted price support
* Product ratings
* Review count
* Product badges
* Product colors
* Product sizes
* Product features
* Stock information
* Category-based product organization

### Shopping

* Add products to cart
* Update cart quantities
* Remove products from cart
* Cart persistence through backend data
* Wishlist functionality
* Add/remove wishlist products
* Product search/filtering
* Product detail pages
* Checkout flow

### Orders

* Checkout page
* Customer address information
* Order creation
* Order items
* Product snapshots within orders
* Order totals
* Payment status
* Payment provider information
* Order success page

---

# 💳 Payment

ShopWave currently uses a **mock payment provider for development and testing**.

The backend is structured so that the payment layer can later be replaced with a real payment gateway without redesigning the complete order system.

Current architecture:

```text
Customer
   ↓
Checkout
   ↓
Create Order
   ↓
Payment Service
   ↓
Mock Payment Provider
   ↓
Payment Status
   ↓
Order Confirmation
```

A production payment provider such as Stripe or Razorpay can be integrated later using the existing payment abstraction.

---

# 📧 Order Confirmation Email

The backend includes an email-service structure for sending order confirmation emails.

The intended confirmation email contains information such as:

* Customer name
* Customer email
* Order ID
* Ordered products
* Quantity
* Product price
* Order subtotal
* Shipping information
* Total amount
* Payment status
* Payment provider/reference information

Sensitive information such as passwords, JWT tokens, card numbers, and CVV information is never included in order emails.

### Current Status

**Email delivery is the remaining deployment task.**

The Render deployment currently reports that SMTP is not configured:

```text
Email service is NOT configured
EMAIL_PROVIDER=smtp requires
SMTP_HOST, SMTP_USER, SMTP_PASSWORD
```

The backend is therefore running successfully, but production order-confirmation emails are not currently being sent.

To enable them, configure SMTP environment variables in Render, for example:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=your-verified-email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
```

The email service should only report `emailSent=true` when the SMTP provider successfully accepts the email.

---

# 🏗️ System Architecture

```text
                    ┌───────────────────────┐
                    │       GitHub          │
                    │    shopwave-new       │
                    └───────────┬───────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
       ┌─────────────────┐             ┌─────────────────┐
       │     Vercel      │             │     Render      │
       │    Frontend     │────────────▶│     Backend     │
       │ React + Vite    │    REST     │ Node + Express  │
       └─────────────────┘     API     └────────┬────────┘
                                                │
                                                ▼
                                      ┌─────────────────┐
                                      │      Neon       │
                                      │   PostgreSQL    │
                                      └─────────────────┘
                                                │
                                                ▼
                                      ┌─────────────────┐
                                      │     Prisma      │
                                      │      ORM        │
                                      └─────────────────┘
```

Email service:

```text
Backend
   │
   ▼
SMTP Provider
   │
   ▼
Customer Order Confirmation
```

---

# 🧰 Tech Stack

## Frontend

| Technology       | Purpose                                 |
| ---------------- | --------------------------------------- |
| React            | User interface                          |
| JavaScript / JSX | Frontend development                    |
| Vite             | Development server and production build |
| Tailwind CSS     | Styling                                 |
| React Router     | Client-side routing                     |
| Context API      | Authentication/application state        |
| Fetch/API layer  | Backend communication                   |

## Backend

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Node.js    | Backend runtime               |
| Express.js | REST API framework            |
| TypeScript | Type-safe backend development |
| Prisma ORM | Database access               |
| Zod        | Request/input validation      |
| JWT        | Authentication                |
| bcryptjs   | Password hashing              |
| CORS       | Cross-origin API access       |

## Database

| Technology     | Purpose             |
| -------------- | ------------------- |
| PostgreSQL     | Relational database |
| Neon           | Hosted PostgreSQL   |
| Prisma Migrate | Database migrations |

## Deployment

| Platform | Responsibility      |
| -------- | ------------------- |
| GitHub   | Source control      |
| Vercel   | Frontend deployment |
| Render   | Backend deployment  |
| Neon     | PostgreSQL database |

---

# 🗄️ Database Design

The application uses PostgreSQL with Prisma ORM.

The current schema contains the following major models:

```text
User
RefreshToken
Address
Category
Product
ProductImage
Cart
CartItem
Wishlist
WishlistItem
Order
OrderItem
Payment
Review
```

### Main relationships

```text
User
 ├── Addresses
 ├── RefreshTokens
 ├── Cart
 │    └── CartItems
 ├── Wishlist
 │    └── WishlistItems
 ├── Orders
 │    └── OrderItems
 └── Reviews

Category
 └── Products
       └── ProductImages

Order
 └── Payment
```

Prisma migrations are stored in:

```text
backend/prisma/migrations/
```

The production database is updated using:

```bash
npx prisma migrate deploy
```

---

# 📁 Project Structure

```text
shopwave-new/
│
├── backend/
│   ├── src/
│   │   ├── ...
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── generated/
│   │
│   ├── prisma7.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 🔐 Authentication Architecture

ShopWave uses access-token and refresh-token authentication.

```text
                 Login
                   │
                   ▼
             Verify email
             + password
                   │
                   ▼
             Generate JWT
              ┌────┴────┐
              │         │
              ▼         ▼
        Access Token   Refresh Token
        short-lived   HTTP-only cookie
              │         │
              ▼         ▼
          API Calls   Token Refresh
```

The access token is used for authenticated API requests.

The refresh token allows the application to obtain a new access token without requiring the customer to log in again.

---

# 🔒 Security Considerations

The project follows several backend security principles:

* Passwords are hashed instead of stored as plaintext.
* JWT secrets are stored in environment variables.
* Refresh tokens are handled separately from access tokens.
* HTTP-only cookies are used for refresh-token storage.
* CORS is configured between the Vercel frontend and Render backend.
* Environment secrets are not committed to GitHub.
* Input validation is performed using Zod.
* Payment secrets are kept on the backend.
* Sensitive authentication credentials are not exposed to the frontend.
* Order emails do not contain passwords, tokens, or card security information.

---

# 🌍 Environment Variables

## Frontend

The frontend requires the backend API URL:

```env
VITE_API_URL=http://localhost:5000
```

For production:

```env
VITE_API_URL=https://shopwave-new.onrender.com
```

## Backend

Important backend environment variables include:

```env
NODE_ENV=production

DATABASE_URL=<NEON_DATABASE_URL>

JWT_ACCESS_SECRET=<ACCESS_TOKEN_SECRET>
JWT_REFRESH_SECRET=<REFRESH_TOKEN_SECRET>

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CORS_ORIGIN=https://shopwave-new.vercel.app

PAYMENT_PROVIDER=mock
PAYMENT_WEBHOOK_SECRET=<SECRET>
PAYMENT_MOCK_SECRET=<SECRET>

EMAIL_PROVIDER=smtp
EMAIL_FROM=<VERIFIED_EMAIL>
SMTP_HOST=<SMTP_HOST>
SMTP_PORT=587
SMTP_USER=<SMTP_USER>
SMTP_PASSWORD=<SMTP_PASSWORD>
SMTP_SECURE=false
```

**Never commit real secrets or passwords to GitHub.**

---

# 🚀 Running the Project Locally

## Prerequisites

Install:

* Node.js
* npm
* Git
* PostgreSQL/Neon account

---

## 1. Clone the repository

```bash
git clone https://github.com/sravankumar27319/shopwave-new.git
cd shopwave-new
```

---

# Backend Setup

```bash
cd backend
npm install
```

Configure your backend `.env` file.

Generate Prisma Client:

```bash
npx prisma generate
```

Apply migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will normally run on the Vite development URL shown in the terminal.

---

# 🏭 Production Deployment

## Frontend — Vercel

Vercel configuration:

```text
Repository: shopwave-new
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Production environment variable:

```env
VITE_API_URL=https://shopwave-new.onrender.com
```

---

## Backend — Render

Render configuration:

```text
Repository: shopwave-new
Root Directory: backend
Runtime: Node
```

Build command:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start command:

```bash
npm start
```

The backend is currently deployed at:

```text
https://shopwave-new.onrender.com
```

---

# 🧱 Production Build Flow

```text
Developer
    │
    ▼
Git commit
    │
    ▼
GitHub main
    │
    ├───────────────────────┐
    ▼                       ▼
Vercel                    Render
    │                       │
npm run build          npm install
    │                       │
    ▼                 Prisma Generate
Frontend Build              │
    │                 Prisma Migrate
    ▼                       │
Production UI          TypeScript Build
                            │
                            ▼
                       Express Server
                            │
                            ▼
                       Neon PostgreSQL
```

---

# 📈 Scalability Considerations

The project is structured with scalability in mind.

### Stateless API

The backend does not depend on frontend state for authentication. JWT-based authentication allows backend instances to remain stateless.

### Database Layer

Prisma provides a structured data-access layer over PostgreSQL.

### Separate Frontend and Backend

The frontend and backend can be deployed and scaled independently.

```text
Frontend scaling
       ↓
Vercel

Backend scaling
       ↓
Render / additional instances

Database scaling
       ↓
Neon PostgreSQL
```

### API-based architecture

The frontend communicates with the backend through REST APIs, allowing the frontend to be replaced or extended independently.

### Payment abstraction

The current mock payment implementation can later be replaced with a real payment provider.

### Email abstraction

The email layer can use an SMTP provider without tightly coupling email functionality to order creation.

---

# 🧪 Testing

The application can be tested using:

* Browser
* Postman
* REST API requests
* Authentication flows
* Cart operations
* Wishlist operations
* Checkout flow
* Order creation
* Payment flow

Important authentication flows to test:

```text
Register
   ↓
Login
   ↓
Access protected API
   ↓
Access token expires
   ↓
Refresh token
   ↓
Receive new access token
   ↓
Continue authenticated session
```

---

# 🛍️ Main User Flow

```text
Landing Page
     ↓
Products
     ↓
Product Details
     ↓
Add to Cart
     ↓
Cart
     ↓
Checkout
     ↓
Address
     ↓
Payment
     ↓
Order Created
     ↓
Order Success
     ↓
Order Confirmation Email
```

The email step is currently the remaining production configuration because SMTP credentials have not yet been configured on Render.

---

# 📌 Current Project Status

| Area                     | Status                |
| ------------------------ | --------------------- |
| React frontend           | ✅ Completed           |
| Responsive e-commerce UI | ✅ Completed           |
| Product pages            | ✅ Completed           |
| Cart                     | ✅ Completed           |
| Wishlist                 | ✅ Completed           |
| Authentication UI        | ✅ Completed           |
| JWT authentication       | ✅ Implemented         |
| Refresh-token flow       | ✅ Implemented         |
| Express backend          | ✅ Deployed            |
| TypeScript backend       | ✅ Completed           |
| Prisma ORM               | ✅ Implemented         |
| PostgreSQL               | ✅ Connected           |
| Neon database            | ✅ Production          |
| Database migrations      | ✅ Applied             |
| REST APIs                | ✅ Implemented         |
| Checkout                 | ✅ Implemented         |
| Mock payment             | ✅ Implemented         |
| Vercel deployment        | ✅ Live                |
| Render deployment        | ✅ Live                |
| CORS configuration       | ✅ Configured          |
| Production SMTP          | ⏳ Remaining           |
| Order confirmation email | ⏳ Remaining           |
| Real payment gateway     | 🔄 Future enhancement |

---

# 🔮 Future Improvements

Possible next production enhancements include:

* Real payment gateway integration
* Transactional order emails
* Email verification
* Password reset
* Order history page
* Order cancellation/refund workflow
* Product reviews and ratings
* Advanced product filtering
* Pagination
* Redis caching
* Rate limiting
* API monitoring
* Centralized logging
* Automated tests
* CI/CD pipeline
* Image optimization/CDN
* Background jobs for email and order processing
* Docker containerization
* Production observability
* Admin product/order management dashboard

---

# 🎯 Learning & Engineering Concepts Demonstrated

This project demonstrates practical full-stack development concepts including:

* React component architecture
* Client-side routing
* REST API development
* Node.js backend development
* Express.js
* TypeScript
* Authentication and authorization
* JWT
* Refresh-token architecture
* Password hashing
* HTTP-only cookies
* CORS
* Input validation
* PostgreSQL database design
* Prisma ORM
* Database migrations
* Relational data modeling
* Payment-service abstraction
* Email-service abstraction
* Environment configuration
* Production deployment
* Git/GitHub workflow
* Vercel deployment
* Render deployment
* Neon PostgreSQL
* Basic scalable system architecture

---

# 👨‍💻 Author

**Sravan Kumar**

GitHub:
https://github.com/sravankumar27319

---

# 📄 License

This project is intended for learning, portfolio, and demonstration purposes.
