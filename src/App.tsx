import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './hooks/useAuth';
import { WorkspaceProvider } from './hooks/useWorkspace';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminManageAdminsPage } from './pages/AdminManageAdminsPage';
import { ExplorePage } from './pages/ExplorePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { OtpVerificationPage } from './pages/OtpVerificationPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { MaterialDetailsPage } from './pages/MaterialDetailsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileUploadsPage } from './pages/ProfileUploadsPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { UploadPage } from './pages/UploadPage';
import { AdminRoute } from './routes/AdminRoute';
import { HomeGate } from './routes/HomeGate';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/verify-otp" element={<OtpVerificationPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<HomeGate />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/materials/:id" element={<MaterialDetailsPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/uploads" element={<ProfileUploadsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/reader/:id" element={<ReaderPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/admins" element={<AdminManageAdminsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
