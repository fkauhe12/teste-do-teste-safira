// context/CartContext.js
import React, { createContext, useState, useContext, useMemo } from "react";

const CartContext = createContext({
  cartItems: [],
  totalItems: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  increaseQty: () => {},
  decreaseQty: () => {},
});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    const resolvedImage =
      product.imageUrl ||
      product.image ||
      product.imagem ||
      product.img ||
      product.foto ||
      product.url ||
      null;

    const normalizedProduct = { ...product, imageUrl: resolvedImage };

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === normalizedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.id === normalizedProduct.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...normalizedProduct, quantidade: 1 }];
    });
  };

  const increaseQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id && item.quantidade > 1
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantidade || 0), 0),
    [cartItems]
  );

  const value = {
    cartItems,
    totalItems,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQty,
    decreaseQty,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}