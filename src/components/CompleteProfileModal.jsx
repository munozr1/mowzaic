import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useAuthentication } from '../AuthenticationContext';

const CompleteProfileModal = ({ isOpen, onComplete }) => {
  const { user, supabase } = useAuthentication();
  const [formData, setFormData] = useState({
    first_name: user?.user_metadata?.firstName || user?.user_metadata?.first_name || '',
    last_name: user?.user_metadata?.lastName || user?.user_metadata?.last_name || '',
    phone: user?.user_metadata?.phone || '',
    promo_opt: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Update the user record in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          promo_opt: formData.promo_opt
        })
        .eq('uid', user.id);

      if (updateError) {
        throw updateError;
      }

      onComplete();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-4 space-y-6 p-8 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            complete your profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            we need a bit more information to get started
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                first name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="john"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                last name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              phone number *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="appearance-none rounded w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              email
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={user?.email || ''}
              className="appearance-none rounded w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="promo_opt"
                name="promo_opt"
                type="checkbox"
                checked={formData.promo_opt}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="promo_opt" className="text-sm text-gray-700 cursor-pointer">
                send me promotional emails and special offers
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                saving...
              </div>
            ) : (
              'continue'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

CompleteProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default CompleteProfileModal;
