import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/index'));
const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const DashboardPage = lazy(() => import('./pages/app/dashboard'));
const GroceriesPage = lazy(() => import('./pages/groceries'));
const ShoppingListPage = lazy(() => import('./pages/shopping-list'));
const FridgeAnalyzerPage = lazy(() => import('./pages/fridge-analyzer'));
const RecipesPage = lazy(() => import('./pages/recipes'));
const ProfilePage = lazy(() => import('./pages/profile'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    </div>
  );
}

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: lazyPage(<LandingPage />),
      },
      {
        path: 'login',
        element: lazyPage(<LoginPage />),
      },
      {
        path: 'register',
        element: lazyPage(<RegisterPage />),
      },
      {
        path: 'app',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: lazyPage(<DashboardPage />),
          },
          {
            path: 'groceries',
            element: lazyPage(<GroceriesPage />),
          },
          {
            path: 'shopping-list',
            element: lazyPage(<ShoppingListPage />),
          },
          {
            path: 'fridge-analyzer',
            element: lazyPage(<FridgeAnalyzerPage />),
          },
          {
            path: 'recipes',
            element: lazyPage(<RecipesPage />),
          },
          {
            path: 'profile',
            element: lazyPage(<ProfilePage />),
          },
        ],
      },
    ],
  },
]);
