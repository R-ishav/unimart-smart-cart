import { useEffect, useState } from 'react';
import { fetchCart } from '../services/api';

// Displays the list of items in the cart
export default function CartItems({ items: propItems }) {
  const [items, setItems] = useState(propItems || []);
  const [loading, setLoading] = useState(!propItems);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propItems) {
      setItems(propItems);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    fetchCart()
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setError('Unable to reach backend. Please try again later.');
        setLoading(false);
      });
  }, [propItems]);

  if (loading) return <div className="p-4">Loading cart...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Cart Items</h2>
      {items.length === 0 ? (
        <div className="text-gray-500">Your cart is empty.</div>
      ) : (
        <ul className="divide-y">
          {items.map((item, idx) => (
            <li key={idx} className="py-2 flex justify-between">
              <span className="font-medium">{item.name}</span>
              <span className="text-right">${item.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
