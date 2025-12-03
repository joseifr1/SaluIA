import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

// Pages
import { Login } from '../pages/Login.jsx';
import SignUp from '../pages/SignUp.jsx';
import { Home } from '../pages/Home.jsx';
import { RegistroNuevo } from '../pages/RegistroNuevo.jsx';
import { Registros } from '../pages/Registros.jsx';
import { ResultadoEvaluacion } from '../pages/ResultadoEvaluacion.jsx';
import { CierreEvaluacion } from '../pages/CierreEvaluacion.jsx';
import { Analitica } from '../pages/Analitica.jsx';
import { AdminUsuarios } from '../pages/AdminUsuarios.jsx';
import { GestioinJefes } from '../pages/GestioinJefes.jsx';
import { NotFound } from '../pages/NotFound.jsx';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'registros',
        children: [
          {
            index: true,
            element: <Registros />,
          },
          {
            path: 'nuevo',
            element: <RegistroNuevo />,
          },
        ],
      },
      {
        path: 'evaluacion',
        children: [
          {
            path: 'resultado/:id',
            element: <ResultadoEvaluacion />,
          },
          {
            path: 'cierre/:id',
            element: <CierreEvaluacion />,
          },
        ],
      },
      {
        path: 'analitica',
        element: <Analitica />,
      },
      {
        path: 'admin',
        children: [
          {
            path: 'usuarios',
            element: (
              <ProtectedRoute requiredRole="admin">
                <AdminUsuarios />
              </ProtectedRoute>
            ),
          },
          {
            path: 'jefes',
            element: (
              <ProtectedRoute requiredRole="admin">
                <GestioinJefes />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}