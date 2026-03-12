import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FlashcardSet {
  id: string;
  topic: string;
  status: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  known: boolean;
}

interface FlashcardsProps {
  onBack: () => void;
}

export default function Flashcards({ onBack }: FlashcardsProps) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSets(data);
  };

  const requestFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic.trim()) return;

    setLoading(true);
    await supabase.from('flashcard_sets').insert({
      user_id: user.id,
      topic: topic.trim(),
      status: 'pending',
    });

    setTopic('');
    setShowRequest(false);
    await fetchSets();
    setLoading(false);
  };

  const openSet = async (setId: string) => {
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true });

    if (data) {
      setCards(data);
      setSelectedSet(setId);
      setCurrentCard(0);
      setFlipped(false);
    }
  };

  const markKnown = async (known: boolean) => {
    if (cards.length === 0) return;

    const card = cards[currentCard];
    await supabase
      .from('flashcards')
      .update({ known })
      .eq('id', card.id);

    const updatedCards = [...cards];
    updatedCards[currentCard] = { ...card, known };
    setCards(updatedCards);

    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
    }
  };

  if (selectedSet && cards.length > 0) {
    const card = cards[currentCard];
    const progress = ((currentCard + 1) / cards.length) * 100;
    const knownCount = cards.filter((c) => c.known).length;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-900 text-white px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setSelectedSet(null)}
              className="flex items-center gap-2 mb-4 hover:underline"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to sets
            </button>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Flashcards</h1>
              <span className="text-sm">
                {currentCard + 1} / {cards.length}
              </span>
            </div>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div
            onClick={() => setFlipped(!flipped)}
            className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              {!flipped ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">Question</p>
                  <p className="text-xl text-gray-900">{card.front}</p>
                  <p className="text-sm text-gray-400 mt-6">Tap to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">Answer</p>
                  <p className="text-xl text-blue-900 font-medium">{card.back}</p>
                </>
              )}
            </div>
          </div>

          {flipped && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => markKnown(false)}
                className="flex-1 py-4 bg-orange-100 text-orange-900 rounded-lg font-semibold hover:bg-orange-200 transition-colors"
              >
                Still Learning
              </button>
              <button
                onClick={() => markKnown(true)}
                className="flex-1 py-4 bg-green-100 text-green-900 rounded-lg font-semibold hover:bg-green-200 transition-colors"
              >
                Known
              </button>
            </div>
          )}

          <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              Progress: {knownCount} / {cards.length} cards marked as known
            </p>
          </div>
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
            <h1 className="text-2xl font-bold">Flashcards</h1>
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
            <h3 className="font-semibold text-blue-900 mb-4">Request Flashcards</h3>
            <form onSubmit={requestFlashcards} className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Thermodynamics, Organic Chemistry)"
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
                    onClick={() => openSet(set.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    Study
                  </button>
                )}
              </div>
            </div>
          ))}

          {sets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No flashcard sets yet.</p>
              <p className="text-sm mt-2">Request your first set to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
