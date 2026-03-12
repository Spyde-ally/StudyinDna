import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface QuestionSet {
  id: string;
  topic: string;
  status: string;
  created_at: string;
}

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface QuestionsProps {
  onBack: () => void;
}

export default function Questions({ onBack }: QuestionsProps) {
  const { user } = useAuth();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('question_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSets(data);
  };

  const requestQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic.trim()) return;

    setLoading(true);
    await supabase.from('question_sets').insert({
      user_id: user.id,
      topic: topic.trim(),
      status: 'pending',
    });

    setTopic('');
    setShowRequest(false);
    await fetchSets();
    setLoading(false);
  };

  const startQuiz = async (setId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true });

    if (data) {
      setQuestions(data);
      setSelectedSet(setId);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setQuizComplete(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const question = questions[currentQuestion];
    const isCorrect = answer === question.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
    }

    if (user) {
      await supabase.from('question_attempts').insert({
        user_id: user.id,
        question_id: question.id,
        selected_answer: answer,
        is_correct: isCorrect,
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-blue-900" />
          </div>
          <h2 className="text-3xl font-bold text-blue-900 mb-2">Quiz Complete!</h2>
          <p className="text-6xl font-bold text-blue-900 my-6">{percentage}%</p>
          <p className="text-gray-600 mb-8">
            You scored {score} out of {questions.length} questions
          </p>
          <button
            onClick={() => setSelectedSet(null)}
            className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            Back to Question Sets
          </button>
        </div>
      </div>
    );
  }

  if (selectedSet && questions.length > 0) {
    const question = questions[currentQuestion];
    const options = [
      { key: 'a', text: question.option_a },
      { key: 'b', text: question.option_b },
      { key: 'c', text: question.option_c },
      { key: 'd', text: question.option_d },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm">Score: {score}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-6 mb-6">
            <p className="text-xl text-gray-900 mb-6">{question.question}</p>

            <div className="space-y-3">
              {options.map((option) => {
                const isSelected = selectedAnswer === option.key;
                const isCorrect = option.key === question.correct_answer;
                let bgColor = 'bg-gray-50 hover:bg-gray-100';

                if (showResult) {
                  if (isCorrect) {
                    bgColor = 'bg-green-100 border-green-500';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'bg-red-100 border-red-500';
                  }
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => !showResult && handleAnswer(option.key)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border-2 border-transparent transition-colors ${bgColor} ${
                      showResult ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span className="font-semibold">{option.key.toUpperCase()}.</span> {option.text}
                  </button>
                );
              })}
            </div>
          </div>

          {showResult && question.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-blue-900 mb-2">Explanation:</p>
              <p className="text-gray-700">{question.explanation}</p>
            </div>
          )}

          {showResult && (
            <button
              onClick={nextQuestion}
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          )}
        </div>
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Practice Questions</h1>
            <button
              onClick={() => setShowRequest(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Request
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showRequest && (
          <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-blue-900 mb-4">Request Questions</h3>
            <form onSubmit={requestQuestions} className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Kinematics, Chemical Bonding)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Requesting...' : 'Request'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-900 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">{set.topic}</h3>
                  <p className="text-sm text-gray-600">
                    {set.status === 'pending' ? (
                      <span className="text-orange-600">Pending approval</span>
                    ) : (
                      <span className="text-green-600">Approved</span>
                    )}
                  </p>
                </div>
                {set.status === 'approved' && (
                  <button
                    onClick={() => startQuiz(set.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          ))}

          {sets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No question sets yet.</p>
              <p className="text-sm mt-2">Request your first set to start practicing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
