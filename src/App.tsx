import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useDarkMode';
import { WorkspaceProvider } from './hooks/useWorkspace';
import { SignupRedirectProvider } from './hooks/useSignupRedirect';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminManageAdminsPage } from './pages/AdminManageAdminsPage';
import { AdminManageMaterialsPage } from './pages/AdminManageMaterialsPage';
import { AdminManageStudentsPage } from './pages/AdminManageStudentsPage';
import { MessagesPage } from './pages/MessagesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { OtpVerificationPage } from './pages/OtpVerificationPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { MaterialDetailsPage } from './pages/MaterialDetailsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileUploadsPage } from './pages/ProfileUploadsPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomerSupportPage } from './pages/CustomerSupportPage';
import { UploadPage } from './pages/UploadPage';
import { AdminRoute } from './routes/AdminRoute';
import { HomeGate } from './routes/HomeGate';
import { RootGate } from './routes/RootGate';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <SignupRedirectProvider>
              <Routes>
                <Route path="/" element={<RootGate />} />

                <Route element={<PublicOnlyRoute />}>
                  <Route path="/get-started" element={<GetStartedPage />} />
                  <Route path="/onboarding" element={<GetStartedPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/verify-otp" element={<OtpVerificationPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/dashboard" element={<HomeGate />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/materials/:id" element={<MaterialDetailsPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/uploads" element={<ProfileUploadsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/support" element={<CustomerSupportPage />} />
                    <Route path="/reader/:id" element={<ReaderPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/documents" element={<AdminManageMaterialsPage />} />
                      <Route path="/admin/materials" element={<AdminManageMaterialsPage />} />
                      <Route path="/admin/students" element={<AdminManageStudentsPage />} />
                      <Route path="/admin/admins" element={<AdminManageAdminsPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SignupRedirectProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
