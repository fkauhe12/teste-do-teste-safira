import React, { createContext, useState, useContext } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    // Normaliza o campo de imagem para `imageUrl` (vários nomes possíveis vindo do backend)
    const resolvedImage =
      product.imageUrl || product.image || product.imagem || product.img || product.foto || product.url || null;

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

      // GARANTIA: produto sempre chega com imagem, nome, preco
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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQty,
        decreaseQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
