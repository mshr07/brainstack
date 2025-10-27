import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Expense, ExpenseCategory, ExpenseFilters } from '../types';
import { expensesAPI, categoriesAPI } from '../services/api';
import Navigation from './Navigation';
import './ExpenseHistory.css';

const ExpenseHistory: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    category: undefined,
    start_date: '',
    end_date: '',
    sort_by: '-date',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoriesAPI.getAll();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const expensesData = await expensesAPI.getHistory(filters);
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [filters]);

  const handleFilterChange = (name: string, value: string | number) => {
    setFilters({
      ...filters,
      [name]: value === '' ? undefined : value,
    });
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesAPI.delete(id);
        setExpenses(expenses.filter(expense => expense.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      start_date: '',
      end_date: '',
      sort_by: '-date',
    });
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="expense-history-page">
      <Navigation />
      
      <div className="expense-history-content">
        <div className="history-header">
          <h1>Expense History</h1>
          <div className="history-summary">
            <span className="total-count">{expenses.length} expenses</span>
            <span className="total-amount">Total: ₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="search">Search</label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or description..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="start_date">From Date</label>
              <input
                type="date"
                id="start_date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="end_date">To Date</label>
              <input
                type="date"
                id="end_date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="sort_by">Sort By</label>
              <select
                id="sort_by"
                value={filters.sort_by || '-date'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <option value="-date">Date (Newest First)</option>
                <option value="date">Date (Oldest First)</option>
                <option value="-amount">Amount (Highest First)</option>
                <option value="amount">Amount (Lowest First)</option>
                <option value="name">Name (A-Z)</option>
                <option value="-name">Name (Z-A)</option>
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="expenses-section">
          {loading ? (
            <div className="loading">Loading expenses...</div>
          ) : expenses.length > 0 ? (
            <div className="expenses-table-container">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="expense-name">{expense.name}</td>
                      <td className="expense-category">
                        <span className="category-badge">{expense.category_name}</span>
                      </td>
                      <td className="expense-amount">₹{parseFloat(expense.amount).toFixed(2)}</td>
                      <td className="expense-date">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="expense-description">
                        {expense.description ? (
                          <span title={expense.description}>
                            {expense.description.length > 30
                              ? `${expense.description.substring(0, 30)}...`
                              : expense.description
                            }
                          </span>
                        ) : (
                          <span className="no-description">—</span>
                        )}
                      </td>
                      <td className="expense-actions">
                        <Link 
                          to={`/edit-expense/${expense.id}`} 
                          className="action-btn edit-btn"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="action-btn delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-expenses">
              <div className="no-expenses-icon">📊</div>
              <h3>No expenses found</h3>
              <p>Try adjusting your filters or <Link to="/add-expense">add a new expense</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistory;