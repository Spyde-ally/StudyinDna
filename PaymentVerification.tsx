import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentVerificationProps {
  onSuccess: () => void;
}

export default function PaymentVerification({ onSuccess }: PaymentVerificationProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('payment_code')
        .eq('payment_code', code)
        .eq('payment_status', 'verified')
        .maybeSingle();

      if (profiles) {
        setError('This code has already been used');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          payment_status: 'verified',
          payment_code: code,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      onSuccess();
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">
            Payment Verification
          </h2>
          <p className="text-gray-600 mb-4">
            Complete your payment to unlock StudyDNA OS
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
            <p className="font-semibold text-blue-900 mb-2">To complete payment:</p>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Send ₹499 via UPI</li>
              <li>2. Contact admin for verification code</li>
              <li>3. Enter code below to activate</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent uppercase"
              placeholder="Enter code"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
