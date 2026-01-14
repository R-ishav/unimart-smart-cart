import { useEffect, useState } from 'react';
import { fetchCart } from '../services/api';

// Displays the total bill amount
export default function TotalBill({ total: propTotal }) {
  const [total, setTotal] = useState(typeof propTotal === 'number' ? propTotal : 0);
  const [loading, setLoading] = useState(propTotal === undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof propTotal === 'number') {
      setTotal(propTotal);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    fetchCart()
      .then(data => {
        setTotal(data.total || 0);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setError('Unable to reach backend. Please try again later.');
        setLoading(false);
      });
  }, [propTotal]);

  if (loading) return <div className="p-4">Loading total...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Total Bill</h2>
      <div className="text-4xl font-extrabold text-green-600">${total.toFixed(2)}</div>
    </div>
  );
}
