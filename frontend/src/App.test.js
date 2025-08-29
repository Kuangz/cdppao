import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

test('renders learn react link', () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
  // The default route might not have "learn react", so let's look for something more generic
  // that should be present on the login page, which is the default route for non-logged-in users.
  const linkElement = screen.getByText(/sign in/i);
  expect(linkElement).toBeInTheDocument();
});
