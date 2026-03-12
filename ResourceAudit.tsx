import { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ResourceAuditProps {
  onBack: () => void;
}

interface Audit {
  id: string;
  exam_target: string;
  current_resources: string;
  weakest_subject: string;
  time_to_exam: string;
  resource_guide?: string;
  created_at: string;
}

export default function ResourceAudit({ onBack }: ResourceAuditProps) {
  const { user } = useAuth();
  const [existingAudit, setExistingAudit] = useState<Audit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    exam_target: '',
    current_resources: '',
    weakest_subject: '',
    time_to_exam: '',
  });

  useEffect(() => {
    fetchAudit();
  }, []);

  const fetchAudit = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('resource_audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setExistingAudit(data);
    } else {
      setShowForm(true);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    const { error } = await supabase.from('resource_audits').insert({
      user_id: user.id,
      ...formData,
    });

    if (!error) {
      await fetchAudit();
      setShowForm(false);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-blue-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Resource Audit</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {existingAudit && !showForm ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Submission</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Exam Target</p>
                  <p className="text-gray-900">{existingAudit.exam_target}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Resources</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{existingAudit.current_resources}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Weakest Subject</p>
                  <p className="text-gray-900">{existingAudit.weakest_subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Time to Exam</p>
                  <p className="text-gray-900">{existingAudit.time_to_exam}</p>
                </div>
              </div>
            </div>

            {existingAudit.resource_guide ? (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-900" />
                  <h2 className="text-xl font-semibold text-blue-900">Your Personalized Guide</h2>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{existingAudit.resource_guide}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-blue-900 mx-auto mb-3" />
                <p className="font-semibold text-blue-900 mb-2">Guide Under Review</p>
                <p className="text-gray-700">
                  Our team is preparing your personalized resource guide. Check back soon!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-blue-900 mb-2">Get Your Resource Guide</h2>
            <p className="text-gray-600 mb-6">
              Answer a few questions to receive a personalized study resource recommendation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Target
                </label>
                <select
                  value={formData.exam_target}
                  onChange={(e) => setFormData({ ...formData, exam_target: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  required
                >
                  <option value="">Select your target exam</option>
                  <option value="NEET 2026">NEET 2026</option>
                  <option value="NEET 2027">NEET 2027</option>
                  <option value="JEE 2026">JEE 2026</option>
                  <option value="JEE 2027">JEE 2027</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Resources (Books, Coaching, Online Platforms)
                </label>
                <textarea
                  value={formData.current_resources}
                  onChange={(e) => setFormData({ ...formData, current_resources: e.target.value })}
                  placeholder="e.g., NCERT, Cengage, Physics Wallah, Unacademy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weakest Subject
                </label>
                <select
                  value={formData.weakest_subject}
                  onChange={(e) => setFormData({ ...formData, weakest_subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  required
                >
                  <option value="">Select your weakest subject</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time to Exam
                </label>
                <select
                  value={formData.time_to_exam}
                  onChange={(e) => setFormData({ ...formData, time_to_exam: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  required
                >
                  <option value="">Select time remaining</option>
                  <option value="Less than 3 months">Less than 3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="More than 12 months">More than 12 months</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Get My Resource Guide'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
