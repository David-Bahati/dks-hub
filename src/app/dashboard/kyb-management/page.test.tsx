
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KybManagementPage from './page';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/firebase';
import { useToast } from "@/hooks/use-toast";

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/firebase', () => ({
  useCollection: jest.fn(),
  useMemoFirebase: jest.fn(query => query),
}));

jest.mock('@/hooks/use-toast', () => ({
    useToast: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
    db: {},
}));

jest.mock('next/link', () => ({ children }: { children: React.ReactNode }) => children);

jest.mock('@/components/auth/withAuth', () => (Component: any) => Component);

const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    doc: jest.fn(),
    addDoc: (...args: any[]) => mockAddDoc(...args),
    serverTimestamp: jest.fn(),
    orderBy: jest.fn(),
}));

describe('KybManagementPage', () => {
    const mockToast = jest.fn();

    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
        (useCollection as jest.Mock).mockReturnValue({ data: [], isLoading: true });
        mockUpdateDoc.mockClear();
        mockAddDoc.mockClear();
        mockToast.mockClear();
    });

    it('should render access denied for non-admin users', () => {
        (useAuth as jest.Mock).mockReturnValue({ user: { role: 'user' } });
        render(<KybManagementPage />);
        expect(screen.getByText(/Accès réservé au service conformité business./i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
        render(<KybManagementPage />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render empty state', () => {
        (useCollection as jest.Mock).mockReturnValue({ data: [], isLoading: false });
        render(<KybManagementPage />);
        expect(screen.getByText(/Aucun dossier Business en attente/i)).toBeInTheDocument();
    });

    const mockPendings = [
        { id: '1', businessName: 'Test Corp', businessRegistrationNumber: '123', businessAddress: '123 Main St', businessType: 'LLC', businessLicenseImage: 'http://example.com/license.jpg' },
        { id: '2', businessName: 'Another Corp', businessRegistrationNumber: '456', businessAddress: '456 Main St', businessType: 'LLC', businessLicenseImage: 'http://example.com/license2.jpg' }
    ];

    it('should render pending KYB requests', () => {
        (useCollection as jest.Mock).mockReturnValue({ data: mockPendings, isLoading: false });
        render(<KybManagementPage />);
        expect(screen.getByText(/Test Corp/i)).toBeInTheDocument();
        expect(screen.getByText(/Another Corp/i)).toBeInTheDocument();
    });

    it('should filter pending KYB requests', () => {
        (useCollection as jest.Mock).mockReturnValue({ data: mockPendings, isLoading: false });
        render(<KybManagementPage />);
        
        fireEvent.change(screen.getByPlaceholderText(/Chercher par raison sociale ou RCCM.../i), { target: { value: 'Test' } });
        expect(screen.getByText(/Test Corp/i)).toBeInTheDocument();
        expect(screen.queryByText(/Another Corp/i)).not.toBeInTheDocument();
    });

    it('should open dialog and approve request', async () => {
        (useCollection as jest.Mock).mockReturnValue({ data: mockPendings, isLoading: false });
        render(<KybManagementPage />);

        fireEvent.click(screen.getAllByText(/Auditer Dossier/i)[0]);
        
        expect(screen.getByText(/Audit KYB Officiel/i)).toBeInTheDocument();
        
        fireEvent.click(screen.getByText(/Certifier l'Entreprise/i));
        
        await waitFor(() => {
            expect(mockUpdateDoc).toHaveBeenCalled();
            expect(mockAddDoc).toHaveBeenCalled();
            expect(mockToast).toHaveBeenCalledWith({ title: "Entreprise Certifiée" });
        });
    });

    it('should open dialog and reject request', async () => {
        (useCollection as jest.Mock).mockReturnValue({ data: mockPendings, isLoading: false });
        render(<KybManagementPage />);

        fireEvent.click(screen.getAllByText(/Auditer Dossier/i)[0]);
        
        expect(screen.getByText(/Audit KYB Officiel/i)).toBeInTheDocument();
        
        const reasonInput = screen.getByPlaceholderText(/Indiquez pourquoi la certification est refusée.../i);
        fireEvent.change(reasonInput, { target: { value: 'Invalid license' } });

        fireEvent.click(screen.getByText(/Refuser Certification/i));

        await waitFor(() => {
            expect(mockUpdateDoc).toHaveBeenCalled();
            expect(mockAddDoc).toHaveBeenCalled();
            expect(mockToast).toHaveBeenCalledWith({ title: "Dossier Rejeté" });
        });
    });

    it('should disable rejection button when reason is empty', () => {
        (useCollection as jest.Mock).mockReturnValue({ data: mockPendings, isLoading: false });
        render(<KybManagementPage />);

        fireEvent.click(screen.getAllByText(/Auditer Dossier/i)[0]);

        expect(screen.getByText(/Audit KYB Officiel/i)).toBeInTheDocument();

        const rejectionButton = screen.getByText(/Refuser Certification/i);
        expect(rejectionButton).toBeDisabled();

        const reasonInput = screen.getByPlaceholderText(/Indiquez pourquoi la certification est refusée.../i);
        fireEvent.change(reasonInput, { target: { value: 'Reason' } });
        
        expect(rejectionButton).not.toBeDisabled();
    });
});
