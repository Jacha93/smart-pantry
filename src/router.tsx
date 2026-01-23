import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/index';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import DashboardPage from './pages/app/dashboard';
import GroceriesPage from './pages/groceries';
import ShoppingListPage from './pages/shopping-list';
import FridgeAnalyzerPage from './pages/fridge-analyzer';
import RecipesPage from './pages/recipes';
import ProfilePage from './pages/profile';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
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
            element: <DashboardPage />,
          },
          {
            path: 'groceries',
            element: <GroceriesPage />,
          },
          {
            path: 'shopping-list',
            element: <ShoppingListPage />,
          },
          {
            path: 'fridge-analyzer',
            element: <FridgeAnalyzerPage />,
          },
          {
            path: 'recipes',
            element: <RecipesPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);
