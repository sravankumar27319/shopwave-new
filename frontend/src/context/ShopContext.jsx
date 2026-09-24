import { createContext, useContext, useReducer } from "react";

const CartContext = createContext(null);
const WishlistContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const addQty = action.item.qty || 1;
      const existing = state.find(
        (i) => i.id === action.item.id && i.size === action.item.size && i.color === action.item.color
      );
      if (existing) {
        return state.map((i) =>
          i.id === action.item.id && i.size === action.item.size && i.color === action.item.color
            ? { ...i, qty: i.qty + addQty }
            : i
        );
      }
      return [...state, { ...action.item, qty: addQty }];
    }
    case "REMOVE":
      return state.filter((i) => !(i.id === action.id && i.size === action.size && i.color === action.color));
    case "UPDATE_QTY":
      return state.map((i) =>
        i.id === action.id && i.size === action.size && i.color === action.color
          ? { ...i, qty: Math.max(1, action.qty) }
          : i
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

function wishlistReducer(state, action) {
  switch (action.type) {
    case "TOGGLE":
      return state.some((i) => i.id === action.item.id)
        ? state.filter((i) => i.id !== action.item.id)
        : [...state, action.item];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function WishlistProvider({ children }) {
  const [wishlist, dispatch] = useReducer(wishlistReducer, []);
  return (
    <WishlistContext.Provider value={{ wishlist, dispatch }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);
