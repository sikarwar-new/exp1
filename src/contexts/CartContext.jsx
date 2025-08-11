// contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem("cartItems");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    console.log("Cart updated:", cartItems); // DEBUGGING
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((prev) => {
      const exists = prev.some((i) => i.title === item.title);
      if (exists) return prev; // Prevent duplicate
      return [...prev, item];
    });
  };

  const removeFromCart = (title) => {
    setCartItems((prev) => prev.filter((item) => item.title !== title));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (title) => {
    return cartItems.some((item) => item.title === title);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
