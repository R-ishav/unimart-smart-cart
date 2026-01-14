import { useEffect, useState } from 'react';
import { fetchCart, fetchTransactions, resetBill } from '../services/api';
import CartItems from '../components/CartItems';
import TotalBill from '../components/TotalBill';
import TransactionLog from '../components/TransactionLog';

export default function Dashboard() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);

  // Poll backend every 2 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const [cartData, txData] = await Promise.all([
          fetchCart(),
          fetchTransactions(),
        ]);
        if (isMounted) {
          setCart(cartData);
          setTransactions((txData || []).filter(t => t.action === 'ADD' || t.action === 'REMOVE'));
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError('Failed to load dashboard data');
          setLoading(false);
        }
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleReset = async () => {
    setResetting(true);
    setCart({ items: [], total: 0 });
    setTransactions([]);
    try {
      await resetBill();
    } catch {}
    setResetting(false);
  };

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Smart Billing Dashboard</h1>
      <button
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        onClick={handleReset}
        disabled={resetting}
      >
        {resetting ? 'Resetting...' : 'Reset Bill'}
      </button>
      <CartItems items={cart.items} />
      <TotalBill total={cart.total} />
      <TransactionLog transactions={transactions} />
    </div>
  );
}
