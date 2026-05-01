import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminPage from './AdminPage';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../components/StatusModal', () => {
  const MockStatusModal = ({ open, onSubmit }) => (
    open ? <button onClick={onSubmit}>Confirm Status Update</button> : null
  );
  MockStatusModal.displayName = 'MockStatusModal';
  return MockStatusModal;
});

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads metrics and shipments', async () => {
    api.get
      .mockResolvedValueOnce({ data: { totalShipments: 12, revenue: 3400, activeExceptions: 2 } })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'abc12345-0000-0000-0000-000000000000',
            status: 'Delayed',
            sender: { address: 'Delhi' },
            receiver: { address: 'Mumbai' },
          },
        ],
      });

    render(<AdminPage />);

    expect(await screen.findByText(/total shipments: 12/i)).toBeInTheDocument();
    expect(screen.getByText(/revenue: ₹3400/i)).toBeInTheDocument();
    expect(screen.getByText(/active exceptions: 2/i)).toBeInTheDocument();
    expect(screen.getByText('Delayed')).toBeInTheDocument();
    expect(screen.getByText('Delhi')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  test('resolves selected shipment exception', async () => {
    api.get
      .mockResolvedValueOnce({ data: { totalShipments: 1, revenue: 100, activeExceptions: 1 } })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'abc12345-0000-0000-0000-000000000000',
            status: 'Delayed',
            sender: { address: 'Delhi' },
            receiver: { address: 'Mumbai' },
          },
        ],
      });
    api.put.mockResolvedValueOnce({ data: {} });

    render(<AdminPage />);

    const openModalButton = await screen.findByRole('button', { name: /change status/i });
    fireEvent.click(openModalButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm status update/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/gateway/admin/resolve-exception', {
        shipmentId: 'abc12345-0000-0000-0000-000000000000',
        forceStatus: 'Delayed',
        notes: 'Manual admin override',
      });
    });
  });
});
