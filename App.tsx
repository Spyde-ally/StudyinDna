import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import OnboardingQuiz from './pages/OnboardingQuiz';
import PaymentVerification from './pages/PaymentVerification';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Flashcards from './pages/Flashcards';
import Questions from './pages/Questions';
import Accountability from './pages/Accountability';
import Community from './pages/Community';
import ResourceAudit from './pages/ResourceAudit';
import AdminPanel from './pages/AdminPanel';

type Page = 'landing' | 'auth' | 'quiz' | 'payment' | 'dashboard' | 'schedule' | 'flashcards' | 'questions' | 'accountability' | 'community' | 'resource-audit' | 'admin';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-blue-900 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'auth') {
      return <Auth onBack={() => setCurrentPage('landing')} />;
    }
    return <Landing onGetStarted={() => setCurrentPage('auth')} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-blue-900 text-xl">Loading profile...</div>
      </div>
    );
  }

  if (profile.is_admin) {
    return <AdminPanel onNavigate={(page: string) => setCurrentPage(page as Page)} />;
  }

  if (!profile.exam_target) {
    return <OnboardingQuiz onComplete={() => setCurrentPage('payment')} />;
  }

  if (profile.payment_status !== 'verified') {
    return <PaymentVerification onSuccess={() => setCurrentPage('dashboard')} />;
  }

  switch (currentPage) {
    case 'schedule':
      return <Schedule onBack={() => setCurrentPage('dashboard')} />;
    case 'flashcards':
      return <Flashcards onBack={() => setCurrentPage('dashboard')} />;
    case 'questions':
      return <Questions onBack={() => setCurrentPage('dashboard')} />;
    case 'accountability':
      return <Accountability onBack={() => setCurrentPage('dashboard')} />;
    case 'community':
      return <Community onBack={() => setCurrentPage('dashboard')} />;
    case 'resource-audit':
      return <ResourceAudit onBack={() => setCurrentPage('dashboard')} />;
    default:
      return <Dashboard onNavigate={(page: string) => setCurrentPage(page as Page)} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
