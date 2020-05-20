import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      if (!products || products.length === 0) {
        return;
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }
    updateProducts();
  }, [products]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementedProducts = products.map(product => {
        if (product.id === id) {
          const updatedProduct = product;
          updatedProduct.quantity += 1;

          return updatedProduct;
        }
        return product;
      });

      setProducts(incrementedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products
        .map(product => {
          if (product.id !== id) return product;

          const updatedProduct = product;
          updatedProduct.quantity -= 1;

          return updatedProduct;
        })
        .filter(product => product.quantity > 0);

      setProducts(updatedProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async ({ id, title, image_url, price }: Omit<Product, 'quantity'>) => {
      const checkIfNewProduct = products.find(product => product.id === id);

      if (!checkIfNewProduct) {
        setProducts(oldProducts => [
          ...oldProducts,
          { id, title, image_url, price, quantity: 1 },
        ]);

        return;
      }

      const updatedProducts = products.map(product => {
        if (product.id !== id) return product;

        const updatedProduct = {
          ...product,
          quantity: product.quantity += 1,
        };

        return updatedProduct;
      });

      setProducts(updatedProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
