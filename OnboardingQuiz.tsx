import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const questions = [
  {
    question: 'How do you learn best?',
    options: ['Visual (diagrams, videos)', 'Auditory (lectures, discussions)', 'Reading/Writing (notes, books)', 'Kinesthetic (hands-on, practice)'],
    key: 'learning_type',
  },
  {
    question: 'How do you remember things best?',
    options: ['Repeating multiple times', 'Understanding concepts deeply', 'Making connections to other topics', 'Using mnemonics and tricks'],
    key: 'memory_style',
  },
  {
    question: 'How long can you focus without a break?',
    options: ['15-25 minutes', '30-45 minutes', '60-90 minutes', '2+ hours'],
    key: 'focus_duration',
  },
  {
    question: 'When do you study best?',
    options: ['Early morning (5-8 AM)', 'Mid-morning (9-12 PM)', 'Afternoon (1-5 PM)', 'Night (8 PM onwards)'],
    key: 'peak_hours',
  },
  {
    question: "What's your biggest distraction?",
    options: ['Phone/Social media', 'Family/Friends', 'Mental fatigue', 'Lack of clarity on what to study'],
    key: 'biggest_distraction',
  },
  {
    question: 'Current exam stress level?',
    options: ['Low - I feel confident', 'Moderate - Some anxiety', 'High - Often stressed', 'Very high - Overwhelming'],
    key: 'stress_level',
  },
  {
    question: 'Which subject needs most work?',
    options: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    key: 'weak_subject',
  },
  {
    question: 'When you hate a topic, you:',
    options: ['Avoid it until necessary', 'Force yourself through it', 'Break it into tiny chunks', 'Find alternative resources'],
    key: 'handle_difficult_topics',
  },
  {
    question: 'Daily study hours available?',
    options: ['2-4 hours', '4-6 hours', '6-8 hours', '8+ hours'],
    key: 'daily_study_hours',
  },
  {
    question: 'Target exam and year?',
    options: ['NEET 2026', 'NEET 2027', 'JEE 2026', 'JEE 2027'],
    key: 'exam_target',
  },
];

interface OnboardingQuizProps {
  onComplete: () => void;
}

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();

  const handleAnswer = (answer: string) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].key]: answer,
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveAnswers(newAnswers);
    }
  };

  const saveAnswers = async (finalAnswers: Record<string, string>) => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update(finalAnswers)
        .eq('id', user.id);

      await refreshProfile();
      onComplete();
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-blue-900">Saving your preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-900 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-8">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className="w-full text-left px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition-colors"
              >
                <span className="text-lg text-gray-700">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {currentQuestion > 0 && (
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="mt-6 text-blue-900 hover:underline"
          >
            ← Previous question
          </button>
        )}
      </div>
    </div>
  );
}
