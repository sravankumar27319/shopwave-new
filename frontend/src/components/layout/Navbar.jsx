import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Search, Menu, X, User, LogOut, Package } from "lucide-react";

import { useCart } from "../../context/ShopContext";
import { useWishlist } from "../../context/ShopContext";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Women", href: "/products?category=women" },
  { label: "Men", href: "/products?category=men" },
  { label: "Kids", href: "/products?category=kids" },
  { label: "Accessories", href: "/products?category=accessories" },
  { label: "Footwear", href: "/products?category=footwear" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate("/");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-white"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-stone-900 text-stone-100 text-center py-2 text-xs font-body tracking-widest uppercase">
          Free shipping on orders above ₹999 · Use code WAVE10 for 10% off
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 -ml-2 text-stone-700"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="font-display text-2xl font-semibold tracking-wide text-stone-900 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              ShopWave
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  className="text-sm font-body text-stone-600 hover:text-stone-900 tracking-wide transition-colors relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-stone-900 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-stone-700 hover:text-stone-900 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Customer Account / Auth state */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-2 text-stone-700 hover:text-stone-900 transition-colors flex items-center gap-1.5 focus:outline-none"
                    aria-label="User Account"
                  >
                    <User size={20} />
                    <span className="hidden md:inline-block text-xs font-medium text-stone-700 max-w-[100px] truncate">
                      {user?.name?.split(" ")[0] || "Account"}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200/90 shadow-lg py-2 z-50 rounded-xs">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-[11px] text-stone-400 uppercase tracking-wider">Signed in as</p>
                        <p className="text-xs font-semibold text-stone-900 truncate mt-0.5">
                          {user?.name || user?.email}
                        </p>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors border-b border-stone-100"
                      >
                        <Package size={14} className="text-stone-400" />
                        My Orders
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={14} className="text-stone-400" />
                        Sign Out
                      </button>

                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-2 text-stone-700 hover:text-stone-900 transition-colors relative"
                  aria-label="Sign in"
                  title="Sign In"
                >
                  <User size={20} />
                </Link>
              )}

              <Link
                to="/wishlist"
                className="p-2 text-stone-700 hover:text-stone-900 transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="p-2 text-stone-700 hover:text-stone-900 transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="border-t border-stone-100 bg-white px-4 py-4 shadow-lg">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <input
                autoFocus
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search for products, categories…"
                className="w-full border border-stone-200 rounded-sm px-4 py-3 pr-12 text-sm font-body focus:outline-none focus:border-stone-400 bg-stone-50"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-100 bg-white shadow-xl">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  className="py-3 px-2 text-stone-700 font-body border-b border-stone-50 text-sm tracking-wide"
                >
                  {l.label}
                </Link>
              ))}

              {/* Mobile Auth Links */}
              {isAuthenticated ? (
                <div className="pt-3 pb-2 px-2 border-t border-stone-100 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-stone-500" />
                    <span className="text-sm font-semibold text-stone-900">{user?.name}</span>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-xs text-stone-700 font-medium tracking-wide uppercase flex items-center gap-1.5"
                  >
                    <Package size={14} />
                    My Orders
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-xs text-rose-600 font-medium tracking-wide uppercase flex items-center gap-1.5"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>

                </div>
              ) : (
                <div className="pt-3 pb-2 px-2 border-t border-stone-100 mt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="py-2.5 px-3 text-center bg-stone-900 text-white text-xs font-semibold tracking-widest uppercase rounded-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="py-2 px-3 text-center text-xs font-semibold text-stone-700 tracking-wider hover:text-stone-900"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
      {/* Spacer for fixed header */}
      <div className="h-[calc(2.5rem+4rem)]" />
    </>
  );
}
