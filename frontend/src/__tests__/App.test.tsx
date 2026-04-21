/**
 * Tests for root route auth-based redirect behavior.
 *
 * **Validates: Requirements 9.1, 9.2**
 *
 * 9.1 — Authenticated users at `/` are redirected to `/overview`
 * 9.2 — Unauthenticated users at `/` see the LandingPage
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock ThemeContext to avoid window.matchMedia issues in jsdom
vi.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the AuthContext module so we can control isAuthenticated
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

// Mock heavy page components to keep tests fast and focused
vi.mock('../pages/LandingPage', () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('../pages/dashboard/CostCalculator', () => ({
  CostCalculator: () => <div data-testid="calculator-page">Calculator</div>,
}));

// Minimal stubs for other route components
vi.mock('../pages/LoginPage', () => ({ LoginPage: () => <div>Login</div> }));
vi.mock('../pages/SignupPage', () => ({ SignupPage: () => <div>Signup</div> }));
vi.mock('../pages/dashboard/Overview', () => ({ Overview: () => <div data-testid="overview-page">Overview</div> }));
vi.mock('../pages/dashboard/Optimization', () => ({ Optimization: () => <div>Optimization</div> }));
vi.mock('../pages/dashboard/Reporting', () => ({ Reporting: () => <div>Reporting</div> }));
vi.mock('../pages/Settings', () => ({ Settings: () => <div>Settings</div> }));
vi.mock('../pages/dashboard/UserManagement', () => ({ UserManagement: () => <div>UserManagement</div> }));
vi.mock('../components/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../context/AdminContext', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAdmin: () => ({ isAdmin: false }),
}));

// We import App after mocks are set up
import App from '../App';

// App uses BrowserRouter internally, but we need MemoryRouter for tests.
// We'll render the inner routes by mocking the Router.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    // Replace BrowserRouter with a pass-through so MemoryRouter from the test wrapper wins
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

function renderApp(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Root route auth redirect', () => {
  it('redirects authenticated users from / to /overview (Req 9.1)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { user_id: 1, role: 'user' },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      authFetch: vi.fn(),
    });

    renderApp('/');

    expect(screen.getByTestId('overview-page')).toBeInTheDocument();
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
  });

  it('shows LandingPage for unauthenticated users at / (Req 9.2)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      authFetch: vi.fn(),
    });

    renderApp('/');

    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.queryByTestId('calculator-page')).not.toBeInTheDocument();
  });
});
