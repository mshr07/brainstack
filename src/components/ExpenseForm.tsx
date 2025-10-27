import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExpenseCategory } from '../types';
import { expensesAPI, categoriesAPI } from '../services/api';
import Navigation from './Navigation';
import './ExpenseForm.css';

const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
  });
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await categoriesAPI.getAll();
        setCategories(categoriesData);

        if (isEditing && id) {
          const expense = await expensesAPI.getById(parseInt(id));
          setFormData({
            name: expense.name,
            description: expense.description || '',
            amount: expense.amount,
            date: expense.date,
            category: expense.category?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [isEditing, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const expenseData = {
        name: formData.name,
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        category: formData.category ? parseInt(formData.category) : undefined,
      };

      if (isEditing && id) {
        await expensesAPI.update(parseInt(id), expenseData);
      } else {
        await expensesAPI.create(expenseData);
      }

      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} expense`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-form-page">
      <Navigation />
      
      <div className="expense-form-content">
        <div className="expense-form-container">
          <h1>{isEditing ? 'Edit Expense' : 'Add New Expense'}</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-group">
              <label htmlFor="name">Expense Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g., Coffee at Starbucks"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                disabled={loading}
                placeholder="₹0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                placeholder="Optional notes about this expense"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Expense' : 'Create Expense')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;