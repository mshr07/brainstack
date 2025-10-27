import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Expense } from '../types';
import { expensesAPI } from '../services/api';
import Navigation from './Navigation';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentExpenses, expenseStats] = await Promise.all([
          expensesAPI.getAll({ sort_by: '-created_at' }),
          expensesAPI.getStats()
        ]);
        
        setExpenses(recentExpenses.slice(0, 5)); // Show only 5 recent expenses
        setStats(expenseStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesAPI.delete(id);
        setExpenses(expenses.filter(expense => expense.id !== id));
        
        // Refresh stats
        const newStats = await expensesAPI.getStats();
        setStats(newStats);
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navigation />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <Link to="/add-expense" className="add-expense-btn">
            + Add New Expense
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats?.total_expenses || 0}</h3>
              <p>Total Expenses</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>₹{stats?.total_amount?.toFixed(2) || '0.00'}</h3>
              <p>Total Amount</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{Object.keys(stats?.categories || {}).length}</h3>
              <p>Categories Used</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>₹{expenses.length > 0 ? (stats?.total_amount / new Date().getDate()).toFixed(2) : '0.00'}</h3>
              <p>Daily Average</p>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="recent-expenses">
          <div className="section-header">
            <h2>Recent Expenses</h2>
            <Link to="/history" className="view-all-link">View All</Link>
          </div>
          
          {expenses.length > 0 ? (
            <div className="expenses-list">
              {expenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-main">
                    <div className="expense-info">
                      <h4>{expense.name}</h4>
                      <p className="expense-category">{expense.category_name}</p>
                      <p className="expense-date">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="expense-amount">
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="expense-actions">
                    <Link to={`/edit-expense/${expense.id}`} className="edit-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteExpense(expense.id)} 
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-expenses">
              <p>No expenses yet. <Link to="/add-expense">Add your first expense</Link></p>
            </div>
          )}
        </div>

        {/* Categories Overview */}
        {stats?.categories && Object.keys(stats.categories).length > 0 && (
          <div className="categories-overview">
            <h2>Spending by Category</h2>
            <div className="categories-grid">
              {Object.entries(stats.categories).map(([categoryName, data]: [string, any]) => (
                <div key={categoryName} className="category-item">
                  <div className="category-header">
                    <h4>{categoryName}</h4>
                    <span className="category-count">{data.count} expenses</span>
                  </div>
                  <div className="category-amount">₹{data.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;