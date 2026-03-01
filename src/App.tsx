import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, ProtectedRoute, useAuth } from "@/lib/auth.tsx";

const LandingPage = React.lazy(() => import("@/pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import("@/pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const AuthCallbackPage = React.lazy(() => import("@/pages/AuthCallbackPage").then(m => ({ default: m.AuthCallbackPage })));
const HomePage = React.lazy(() => import("@/pages/HomePage").then(m => ({ default: m.HomePage })));
const EditorPage = React.lazy(() => import("@/pages/EditorPage").then(m => ({ default: m.EditorPage })));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? "/home" : "/landing"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:projectId"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
