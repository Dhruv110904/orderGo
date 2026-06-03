"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { pricePerOrderedUnit } from "@/lib/units";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  category: string | null;
  baseUnit: string; // 'g' | 'mL' | 'unit'
  basePricePerUnit: number;
  orderedUnit: string; // chosen display unit: 'g' | 'kg' | 'mL' | 'L' | 'unit'
  orderedQuantity: number;
  lineTotal: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineTotal">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateUnit: (productId: string, unit: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("ordergo_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ordergo_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, "lineTotal">) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === newItem.productId
      );

      const unitPrice = pricePerOrderedUnit(newItem.basePricePerUnit, newItem.orderedUnit);
      const lineTotal = parseFloat((newItem.orderedQuantity * unitPrice).toFixed(2));

      if (existingItemIndex > -1) {
        // Item exists, update quantity and recalculate
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // If same unit, add quantity. If different unit, overwrite with new selection.
        if (existingItem.orderedUnit === newItem.orderedUnit) {
          existingItem.orderedQuantity += newItem.orderedQuantity;
        } else {
          existingItem.orderedUnit = newItem.orderedUnit;
          existingItem.orderedQuantity = newItem.orderedQuantity;
        }
        
        const newPrice = pricePerOrderedUnit(existingItem.basePricePerUnit, existingItem.orderedUnit);
        existingItem.lineTotal = parseFloat((existingItem.orderedQuantity * newPrice).toFixed(2));
        
        return updatedItems;
      } else {
        // Item is new
        return [...prevItems, { ...newItem, lineTotal }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const unitPrice = pricePerOrderedUnit(item.basePricePerUnit, item.orderedUnit);
          const lineTotal = parseFloat((quantity * unitPrice).toFixed(2));
          return { ...item, orderedQuantity: quantity, lineTotal };
        }
        return item;
      })
    );
  };

  const updateUnit = (productId: string, unit: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const unitPrice = pricePerOrderedUnit(item.basePricePerUnit, unit);
          const lineTotal = parseFloat((item.orderedQuantity * unitPrice).toFixed(2));
          return { ...item, orderedUnit: unit, lineTotal };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Total cart amount
  const cartTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  // Total items in cart
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateUnit,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
