import { useEffect, useState } from 'react'
import { useAuthentication } from '../AuthenticationContext';
import PropTypes from 'prop-types';
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

function BookingStatus({bookingId, updateBookingState}) {
  const { token } = useAuthentication();
  const [status, setStatus] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(`${apiUrl}/book/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setStatus(data.status);
      if (data.status === 'paid') {
        updateBookingState('thank-you');
      }
    }
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-10 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center p-8 max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-block px-4 py-1 mb-6 bg-[#FFD700]/10 backdrop-blur-sm rounded-full"
        >
          <span className="text-[#2EB966] text-sm font-medium">
            {status === 'canceled' ? 'Booking Canceled' : 'We are working on your booking'}
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-6xl font-bold text-[#2EB966] mb-6"
        >
          {status === 'pending' ? (
            <div className="flex justify-center items-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#2EB966]" />
            </div>
          ) : status === 'canceled' ? (
            <div className="text-3xl text-red-500">
              Your booking has been canceled. Please try again.
            </div>
          ) : null}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-[#2EB966]"
        >
          <span className="font-bold">- mowzaic</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

BookingStatus.propTypes = {
  bookingId: PropTypes.string.isRequired,
  updateBookingState: PropTypes.func.isRequired
}

export default BookingStatus;
