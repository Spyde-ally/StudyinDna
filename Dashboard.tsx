import { Calendar, BookOpen, Users, Target, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, signOut } = useAuth();

  const learningTypeDescriptions: Record<string, string> = {
    'Visual (diagrams, videos)': 'You learn best through visual aids. Use diagrams and mind maps!',
    'Auditory (lectures, discussions)': 'You learn best through listening. Record and replay concepts!',
    'Reading/Writing (notes, books)': 'You learn best through written material. Take detailed notes!',
    'Kinesthetic (hands-on, practice)': 'You learn best by doing. Practice problems are your strength!',
  };

  const quickActions = [
    { name: 'Flashcards', icon: BookOpen, action: 'flashcards', color: 'bg-blue-100 text-blue-900' },
    { name: 'Questions', icon: Target, action: 'questions', color: 'bg-green-100 text-green-900' },
    { name: 'Schedule', icon: Calendar, action: 'schedule', color: 'bg-purple-100 text-purple-900' },
    { name: 'Community', icon: Users, action: 'community', color: 'bg-orange-100 text-orange-900' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">StudyDNA OS</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">
            Welcome back, {profile?.name}!
          </h2>
          <p className="text-gray-600">Ready to crush your {profile?.exam_target} prep today?</p>
        </div>

        {profile?.learning_type && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="font-semibold text-blue-900 mb-2">Your Learning Profile</h3>
            <p className="text-gray-700 font-medium">{profile.learning_type}</p>
            <p className="text-sm text-gray-600 mt-1">
              {learningTypeDescriptions[profile.learning_type] || 'Personalized for your learning style'}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
          <h3 className="font-semibold text-blue-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={() => onNavigate(action.action)}
                  className={`${action.color} p-4 rounded-lg flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="font-semibold">{action.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('accountability')}
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-900 transition-colors text-left"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Accountability</h3>
            <p className="text-sm text-gray-600">Track goals with your partner</p>
          </button>

          <button
            onClick={() => onNavigate('resource-audit')}
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-900 transition-colors text-left"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Resource Audit</h3>
            <p className="text-sm text-gray-600">Get your personalized guide</p>
          </button>
        </div>
      </div>
    </div>
  );
}
