import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AccountabilityProps {
  onBack: () => void;
}

interface Goals {
  goal_1?: string;
  goal_2?: string;
  goal_3?: string;
  personal_goal?: string;
  checkins: string[];
}

export default function Accountability({ onBack }: AccountabilityProps) {
  const { user, profile } = useAuth();
  const [myGoals, setMyGoals] = useState<Goals | null>(null);
  const [partnerGoals, setPartnerGoals] = useState<Goals | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [weekStart] = useState(getMonday(new Date()));

  useEffect(() => {
    fetchGoals();
  }, []);

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchGoals = async () => {
    if (!user) return;

    setLoading(true);
    const weekDate = weekStart.toISOString().split('T')[0];

    const { data: myGoalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_of', weekDate)
      .maybeSingle();

    if (myGoalsData) {
      setMyGoals({
        ...myGoalsData,
        checkins: myGoalsData.checkins || [],
      });
    }

    if (profile?.partner_id) {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', profile.partner_id)
        .maybeSingle();

      if (partnerProfile) {
        setPartnerName(partnerProfile.name);
      }

      const { data: partnerGoalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', profile.partner_id)
        .eq('week_of', weekDate)
        .maybeSingle();

      if (partnerGoalsData) {
        setPartnerGoals({
          ...partnerGoalsData,
          checkins: partnerGoalsData.checkins || [],
        });
      }
    }

    setLoading(false);
  };

  const checkInToday = async () => {
    if (!user || !myGoals) return;

    const today = new Date().toISOString().split('T')[0];
    const weekDate = weekStart.toISOString().split('T')[0];

    if (myGoals.checkins.includes(today)) return;

    const newCheckins = [...myGoals.checkins, today];

    await supabase
      .from('goals')
      .upsert({
        user_id: user.id,
        week_of: weekDate,
        goal_1: myGoals.goal_1,
        goal_2: myGoals.goal_2,
        goal_3: myGoals.goal_3,
        personal_goal: myGoals.personal_goal,
        checkins: newCheckins,
      });

    setMyGoals({ ...myGoals, checkins: newCheckins });
  };

  const isCheckedInToday = () => {
    if (!myGoals) return false;
    const today = new Date().toISOString().split('T')[0];
    return myGoals.checkins.includes(today);
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
          <h1 className="text-2xl font-bold">Accountability</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Weekly Goals</h2>
          {myGoals ? (
            <div className="space-y-3">
              {myGoals.goal_1 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{myGoals.goal_1}</p>
                </div>
              )}
              {myGoals.goal_2 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{myGoals.goal_2}</p>
                </div>
              )}
              {myGoals.goal_3 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{myGoals.goal_3}</p>
                </div>
              )}
              {myGoals.personal_goal && (
                <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Personal Goal</p>
                    <p className="text-gray-700">{myGoals.personal_goal}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No goals set for this week. Contact admin to set goals.</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-blue-900 mb-4">Daily Check-in</h3>
          <p className="text-gray-600 mb-4">
            Mark today as complete to maintain your streak!
          </p>
          <button
            onClick={checkInToday}
            disabled={isCheckedInToday()}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isCheckedInToday()
                ? 'bg-green-100 text-green-900 cursor-default'
                : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            {isCheckedInToday() ? 'Checked in today!' : 'Check in for today'}
          </button>
          <p className="text-sm text-gray-600 mt-4">
            Current week streak: {myGoals?.checkins.length || 0} days
          </p>
        </div>

        {profile?.partner_id && partnerName && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              {partnerName}'s Goals
            </h2>
            {partnerGoals && (partnerGoals.goal_1 || partnerGoals.goal_2 || partnerGoals.goal_3) ? (
              <div className="space-y-3">
                {partnerGoals.goal_1 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{partnerGoals.goal_1}</p>
                  </div>
                )}
                {partnerGoals.goal_2 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{partnerGoals.goal_2}</p>
                  </div>
                )}
                {partnerGoals.goal_3 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{partnerGoals.goal_3}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
                  Their streak: {partnerGoals.checkins.length} days this week
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Your partner hasn't set goals yet.</p>
            )}
          </div>
        )}

        {!profile?.partner_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-semibold text-blue-900 mb-1">No accountability partner yet</p>
            <p>Contact admin to be paired with a study partner!</p>
          </div>
        )}
      </div>
    </div>
  );
}
