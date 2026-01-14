import { useEffect, useState } from 'react';
import { fetchTransactions } from '../services/api';

// Displays the transaction log
export default function TransactionLog({ transactions: propTx }) {
  const [transactions, setTransactions] = useState(propTx || []);
  const [loading, setLoading] = useState(!propTx);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propTx) {
      setTransactions(propTx);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    fetchTransactions()
      .then(data => {
        // Only show ADD/REMOVE
        setTransactions((data || []).filter(t => t.action === 'ADD' || t.action === 'REMOVE'));
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        setError('Unable to reach backend. Please try again later.');
        setLoading(false);
      });
  }, [propTx]);

  if (loading) return <div className="p-4">Loading transactions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Transaction Log</h2>
      {transactions.length === 0 ? (
        <div className="text-gray-500">No transactions yet.</div>
      ) : (
        <ul className="divide-y">
          {transactions.map((t, idx) => (
            <li key={t._id || idx} className="py-2 flex justify-between">
              <span className={t.action === 'ADD' ? 'text-green-600' : 'text-red-600'}>
                {t.action}
              </span>
              <span className="font-medium">{t.item}</span>
              <span>${t.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
