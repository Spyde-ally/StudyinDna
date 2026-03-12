import { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ScheduleProps {
  onBack: () => void;
}

interface DaySchedule {
  subject: string;
  topic: string;
  duration: string;
  completed: boolean;
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule({ onBack }: ScheduleProps) {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule[]>>({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  useEffect(() => {
    fetchSchedule();
  }, [weekStart]);

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchSchedule = async () => {
    if (!user) return;

    setLoading(true);
    const weekDate = weekStart.toISOString().split('T')[0];

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_of', weekDate)
      .maybeSingle();

    if (data) {
      const scheduleData: Record<string, DaySchedule[]> = {};
      daysOfWeek.forEach((day) => {
        scheduleData[day] = data[day] || [];
      });
      setSchedule(scheduleData);
    } else {
      const emptySchedule: Record<string, DaySchedule[]> = {};
      daysOfWeek.forEach((day) => {
        emptySchedule[day] = [];
      });
      setSchedule(emptySchedule);
    }

    setLoading(false);
  };

  const toggleComplete = async (day: string, index: number) => {
    if (!user) return;

    const updatedDay = [...schedule[day]];
    updatedDay[index] = {
      ...updatedDay[index],
      completed: !updatedDay[index].completed,
    };

    const newSchedule = {
      ...schedule,
      [day]: updatedDay,
    };

    setSchedule(newSchedule);

    const weekDate = weekStart.toISOString().split('T')[0];
    await supabase
      .from('schedules')
      .upsert({
        user_id: user.id,
        week_of: weekDate,
        [day]: updatedDay,
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-blue-900">Loading schedule...</p>
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
          <h1 className="text-2xl font-bold">My Schedule</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-blue-900">
              Week of {weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {daysOfWeek.map((day, index) => (
              <div key={day} className="p-6">
                <h3 className="font-semibold text-blue-900 mb-3">{dayLabels[index]}</h3>
                {schedule[day]?.length > 0 ? (
                  <div className="space-y-2">
                    {schedule[day].map((session: DaySchedule, sessionIndex: number) => (
                      <div
                        key={sessionIndex}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <button
                          onClick={() => toggleComplete(day, sessionIndex)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            session.completed
                              ? 'bg-blue-900 border-blue-900'
                              : 'border-gray-300'
                          }`}
                        >
                          {session.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${session.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {session.subject} - {session.topic}
                          </p>
                          <p className="text-sm text-gray-600">{session.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No sessions scheduled</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold text-blue-900 mb-1">Note:</p>
          <p>Your schedule is personalized by our team. Contact admin to request changes.</p>
        </div>
      </div>
    </div>
  );
}
