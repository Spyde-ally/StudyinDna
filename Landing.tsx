import { CheckCircle } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const features = [
    'Personalised plan',
    'AI flashcards',
    'Practice questions',
    'Weekly schedule',
    'Accountability partner',
    'Community',
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-900 mb-4 leading-tight">
            Study smarter. Built for your brain.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">
            A personalised study system for NEET and JEE aspirants
          </p>

          <button
            onClick={onGetStarted}
            className="bg-blue-900 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-blue-800 transition-colors mb-12 shadow-lg"
          >
            Get Started — ₹499
          </button>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {features.map((feature) => (
              <div key={feature} className="flex items-center justify-center sm:justify-start gap-3 p-4">
                <CheckCircle className="w-6 h-6 text-blue-900 flex-shrink-0" />
                <span className="text-lg text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <button onClick={onGetStarted} className="text-blue-900 font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
