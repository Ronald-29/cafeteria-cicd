import { render, screen } from '@testing-library/react';
import App from './App';

test('muestra el titulo principal de Aroma Cafe', () => {
  render(<App />);

  const titulo = screen.getByText(/Café recién hecho/i);

  expect(titulo).toBeInTheDocument();
});