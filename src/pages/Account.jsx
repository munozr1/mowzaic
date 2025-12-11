import { useState, useEffect } from 'react';
import { useAuthentication } from '../AuthenticationContext';
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

function Account() {
  const { user, supabase } = useAuthentication();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;

      // Get user data from users table (trigger auto-creates on signup)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      setUserData(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || ''
      });
    }
    fetchUser();
  }, [user, supabase]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Update users table using uid
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('uid', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setUserData({
        ...userData,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2EB966]"
                required
              />
            </div>

            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2EB966]"
                required
              />
            </div>

            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2EB966]"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#2EB966] rounded-md hover:bg-[#2EB966]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2EB966] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-sm font-medium text-gray-500">Name</h2>
                <p className="mt-1 text-lg text-gray-900">
                  {userData?.first_name} {userData?.last_name}
                </p>
              </div>

              <div className="border-b pb-4">
                <h2 className="text-sm font-medium text-gray-500">Email</h2>
                <p className="mt-1 text-lg text-gray-900">{userData?.email}</p>
              </div>

              <div className="border-b pb-4">
                <h2 className="text-sm font-medium text-gray-500">Phone</h2>
                <p className="mt-1 text-lg text-gray-900">{userData?.phone}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2EB966] rounded-md hover:bg-[#2EB966]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2EB966]"
              >
                Edit Profile
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Account; 
