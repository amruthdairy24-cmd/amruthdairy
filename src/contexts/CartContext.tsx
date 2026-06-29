'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  name: string
  price: string
  unit: string
  image: string
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (name: string) => void
  updateQuantity: (name: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load cart from local storage on mount
  useEffect(() => {
    setIsMounted(true)
    const storedCart = localStorage.getItem('amruth_cart')
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart))
      } catch (e) {
        console.error('Failed to parse cart items')
      }
    }
  }, [])

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('amruth_cart', JSON.stringify(cartItems))
    }
  }, [cartItems, isMounted])

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.name === item.name)
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (name: string) => {
    setCartItems(prev => prev.filter(i => i.name !== name))
  }

  const updateQuantity = (name: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(name)
      return
    }
    setCartItems(prev => prev.map(i => i.name === name ? { ...i, quantity } : i))
  }

  const clearCart = () => setCartItems([])

  const cartTotal = cartItems.reduce((total, item) => {
    // Parse price (remove currency symbol, convert to number)
    const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''))
    return total + (numericPrice * item.quantity)
  }, 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
