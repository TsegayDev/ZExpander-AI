import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/icons';

// Pages
import { HomePage }     from '@/pages/home-page';
import { SignInPage }   from '@/pages/sign-in-page';
import { SignUpPage }   from '@/pages/sign-up-page';
import { ExpandPage }   from '@/pages/expand-page';
import { PlansPage }    from '@/pages/plans-page';
import { SettingsPage } from '@/pages/settings-page';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Logo className="w-12 h-12 animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Logo className="w-12 h-12 animate-pulse" />
      </div>
    );
  }
  if (user) return <Navigate to="/expand" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><HomePage /></PublicOnlyRoute>} />
      <Route path="/signin" element={<PublicOnlyRoute><SignInPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
      <Route path="/expand"   element={<ProtectedRoute><ExpandPage /></ProtectedRoute>} />
      <Route path="/plans"    element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
