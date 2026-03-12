import { useState, useEffect } from 'react';
import { Users, BookOpen, Target, FileText, LogOut, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../lib/supabase';

interface AdminPanelProps {
  onNavigate: (page: string) => void;
}

interface Student extends Profile {
  last_active: string;
}

interface PendingRequest {
  id: string;
  user_id: string;
  topic: string;
  created_at: string;
  user_name: string;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'flashcards' | 'questions' | 'audits'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingFlashcards, setPendingFlashcards] = useState<PendingRequest[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<PendingRequest[]>([]);
  const [pendingAudits, setPendingAudits] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);

    if (activeTab === 'students') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (data) setStudents(data);
    } else if (activeTab === 'flashcards') {
      const { data } = await supabase
        .from('flashcard_sets')
        .select(`
          id,
          user_id,
          topic,
          created_at,
          profiles!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingFlashcards(
          data.map((item: { id: string; user_id: string; topic: string; created_at: string; profiles: { name: string } }) => ({
            id: item.id,
            user_id: item.user_id,
            topic: item.topic,
            created_at: item.created_at,
            user_name: item.profiles.name,
          }))
        );
      }
    } else if (activeTab === 'questions') {
      const { data } = await supabase
        .from('question_sets')
        .select(`
          id,
          user_id,
          topic,
          created_at,
          profiles!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingQuestions(
          data.map((item: { id: string; user_id: string; topic: string; created_at: string; profiles: { name: string } }) => ({
            id: item.id,
            user_id: item.user_id,
            topic: item.topic,
            created_at: item.created_at,
            user_name: item.profiles.name,
          }))
        );
      }
    } else if (activeTab === 'audits') {
      const { data } = await supabase
        .from('resource_audits')
        .select(`
          id,
          user_id,
          exam_target,
          current_resources,
          weakest_subject,
          time_to_exam,
          resource_guide,
          created_at,
          profiles!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setPendingAudits(
          data.map((item: { id: string; user_id: string; created_at: string; profiles: { name: string }; exam_target: string; weakest_subject: string; resource_guide?: string }) => ({
            id: item.id,
            user_id: item.user_id,
            topic: `${item.profiles.name} - ${item.exam_target} (${item.weakest_subject})`,
            created_at: item.created_at,
            user_name: item.profiles.name,
          }))
        );
      }
    }

    setLoading(false);
  };

  const approveFlashcardSet = async (id: string) => {
    await supabase
      .from('flashcard_sets')
      .update({ status: 'approved' })
      .eq('id', id);

    fetchData();
  };

  const rejectFlashcardSet = async (id: string) => {
    await supabase.from('flashcard_sets').delete().eq('id', id);
    fetchData();
  };

  const approveQuestionSet = async (id: string) => {
    await supabase
      .from('question_sets')
      .update({ status: 'approved' })
      .eq('id', id);

    fetchData();
  };

  const rejectQuestionSet = async (id: string) => {
    await supabase.from('question_sets').delete().eq('id', id);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Flashcard Requests
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Target className="w-4 h-4" />
            Question Requests
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'audits'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Resource Audits
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'students' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.exam_target || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                student.payment_status === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {student.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {student.created_at ? formatDate(student.created_at) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {students.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No students yet</div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="space-y-4">
                {pendingFlashcards.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">{request.topic}</h3>
                        <p className="text-sm text-gray-600">Requested by: {request.user_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveFlashcardSet(request.id)}
                          className="p-2 bg-green-100 text-green-900 rounded-lg hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => rejectFlashcardSet(request.id)}
                          className="p-2 bg-red-100 text-red-900 rounded-lg hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingFlashcards.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No pending requests
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                {pendingQuestions.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">{request.topic}</h3>
                        <p className="text-sm text-gray-600">Requested by: {request.user_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveQuestionSet(request.id)}
                          className="p-2 bg-green-100 text-green-900 rounded-lg hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => rejectQuestionSet(request.id)}
                          className="p-2 bg-red-100 text-red-900 rounded-lg hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingQuestions.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No pending requests
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audits' && (
              <div className="space-y-4">
                {pendingAudits.map((audit) => (
                  <div key={audit.id} className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-semibold text-blue-900 mb-2">{audit.topic}</h3>
                    <p className="text-sm text-gray-500 mb-4">{formatDate(audit.created_at)}</p>
                    <button
                      onClick={() => onNavigate(`audit-${audit.id}`)}
                      className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {pendingAudits.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    No audits submitted yet
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
