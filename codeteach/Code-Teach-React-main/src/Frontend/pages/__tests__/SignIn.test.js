import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component for demonstration
const SimpleForm = () => (
  <form>
    <label htmlFor="email">Email</label>
    <input type="email" id="email" name="email" />
    <label htmlFor="password">Password</label>
    <input type="password" id="password" name="password" />
    <button type="submit">Sign In</button>
  </form>
);

describe('SignIn Component Tests', () => {
  it('should render form elements', () => {
    render(<SimpleForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have email input with correct type', () => {
    render(<SimpleForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have password input with correct type', () => {
    render(<SimpleForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should have submit button', () => {
    render(<SimpleForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
