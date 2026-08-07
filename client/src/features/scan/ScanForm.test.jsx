import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScanForm from './ScanForm.jsx';

describe('ScanForm', () => {
  it('calls onScan with the trimmed URL', async () => {
    const onScan = vi.fn();
    const user = userEvent.setup();
    render(<ScanForm onScan={onScan} isLoading={false} />);

    await user.type(screen.getByLabelText(/enter a webpage url/i), '  https://example.com  ');
    await user.click(screen.getByRole('button', { name: /scan/i }));

    expect(onScan).toHaveBeenCalledWith('https://example.com');
  });

  it('shows an error for an empty URL', async () => {
    const onScan = vi.fn();
    const user = userEvent.setup();
    render(<ScanForm onScan={onScan} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: /scan/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/enter a url/i);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('shows an error for a URL missing a protocol', async () => {
    const user = userEvent.setup();
    render(<ScanForm onScan={vi.fn()} isLoading={false} />);

    await user.type(screen.getByLabelText(/enter a webpage url/i), 'example.com');
    await user.click(screen.getByRole('button', { name: /scan/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/http/i);
  });

  it('disables inputs and shows Scanning while loading', () => {
    render(<ScanForm onScan={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: /scanning/i })).toBeDisabled();
    expect(screen.getByPlaceholderText('https://example.com')).toBeDisabled();
  });
});
