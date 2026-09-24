# ShopWave — E-Commerce Frontend

A complete, production-quality e-commerce frontend built with **React 18**, **React Router v6**, and **Tailwind CSS v4**.

Inspired by [foreverbuy.in](https://foreverbuy.in/) — clean editorial aesthetic, warm amber-gold accent, Cormorant Garamond display typeface.


Demo Live:https://shopwave-j2m0fxou3-sravankumar27319-9066s-projects.vercel.app/

---

## Features

| Feature | Details |
|---|---|
| 🏠 Home Page | Hero carousel, category strip, featured products, promo banners |
| 🛍 Product Listing | Grid layout, category tabs, sort, price filter |
| 🔍 Search | Live search via navbar, results filtered inline |
| 📦 Product Detail | Image gallery, size/color selectors, qty picker, tabs |
| 🛒 Cart | Qty update, remove, order summary, savings display |
| ❤️ Wishlist | Add/remove, move to cart |
| ⚡ Skeletons | Loading skeletons on all data-fetching views |
| 📱 Responsive | Mobile-first, works from 320px to 4K |
| 🎠 Carousel | Auto-advancing hero with dot + arrow controls |

---

## Folder Architecture

```
shopwave/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx               # Entry point
    ├── App.jsx                # Router + providers
    ├── index.css              # Tailwind v4 CSS-first config + theme
    ├── context/
    │   └── ShopContext.jsx    # Cart & Wishlist context (useReducer)
    ├── data/
    │   └── products.js        # 12 products, 5 categories, banner data
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx     # Sticky navbar, search dropdown, mobile menu
    │   │   └── Footer.jsx     # Links, social icons
    │   ├── products/
    │   │   └── ProductCard.jsx # Hover overlay, quick-add, wishlist toggle
    │   └── ui/
    │       └── Skeletons.jsx  # ProductCard, ProductDetail, Banner skeletons
    └── pages/
        ├── HomePage.jsx       # Hero + categories + featured + promo
        ├── ProductsPage.jsx   # Listing with filters & sort
        ├── ProductDetailPage.jsx # Full detail with gallery & related
        ├── CartPage.jsx       # Cart items + order summary
        └── WishlistPage.jsx   # Saved items
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

> Requires Node.js 18+

---

## Tech Stack

- **React 18** — UI
- **React Router v6** — Client-side routing
- **Tailwind CSS v4** — CSS-first config via `@theme {}`, `@tailwindcss/vite` plugin
- **Lucide React** — Icons
- **Vite 5** — Build tool

---

## Design System

| Token | Value |
|---|---|
| Display font | Cormorant Garamond (300/400/600) |
| Body font | Inter (300/400/500/600) |
| Brand accent | Amber `#d4882a` / `amber-600` |
| Neutral base | Stone scale |
| Border radius | `0.125rem` (near-square — editorial feel) |

---

## State Management

Global state lives in `src/context/ShopContext.jsx` using React's built-in `useReducer` + Context API — no external state library needed.

- **CartContext** — add, remove, update qty, clear
- **WishlistContext** — toggle (add/remove)
