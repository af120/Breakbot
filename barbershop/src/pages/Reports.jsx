import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api';

export default function Reports() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await api.getPayments();
      const e = await api.getExpenses();
      setPayments(p);
      setExpenses(e);
    } catch (err) {
      console.error(err);
    }
  };

  const totalIncome = payments.reduce((acc, curr) => acc + (curr.amount - curr.discount), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const exportCSV = () => {
    const csvRows = [];
    csvRows.push('Type,Date,Description,Amount');
    payments.forEach(p => {
      csvRows.push(`Income,${p.date},${p.service_name} by ${p.barber_name},${p.amount - p.discount}`);
    });
    expenses.forEach(e => {
      csvRows.push(`Expense,${e.date},${e.category} - ${e.note},${e.amount}`);
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <div className="header-row">
        <h2>Reports</h2>
        <button className="btn btn-secondary" onClick={exportCSV}><Download size={18} /> Export CSV</button>
      </div>

      <div className="grid grid-4 mb-4">
        <div className="card text-center">
          <p className="text-muted mb-1">Total Income</p>
          <h2 className="text-success">${totalIncome.toFixed(2)}</h2>
        </div>
        <div className="card text-center">
          <p className="text-muted mb-1">Total Expenses</p>
          <h2 className="text-danger">${totalExpenses.toFixed(2)}</h2>
        </div>
        <div className="card text-center">
          <p className="text-muted mb-1">Net Profit</p>
          <h2 className={netProfit >= 0 ? "text-success" : "text-danger"}>${netProfit.toFixed(2)}</h2>
        </div>
        <div className="card text-center">
          <p className="text-muted mb-1">Total Customers Served</p>
          <h2>{payments.length}</h2>
        </div>
      </div>
    </div>
  );
}
