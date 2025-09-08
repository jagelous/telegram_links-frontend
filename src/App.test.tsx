import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders telegram links app', () => {
  render(<App />);
  const headingElement = screen.getByText(/telegram links/i);
  expect(headingElement).toBeInTheDocument();
});
