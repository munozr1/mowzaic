import { useEffect, useState } from 'react'
import { useAuthentication } from '../AuthenticationContext';
import PropTypes from 'prop-types';
function BookingStatus({bookingId}) {
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
    }
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

	return (
		<div>
			<h1>Booking Status</h1>
			<p>Booking ID: {bookingId}</p>
      <p>Status: {status}</p>
		</div>
	);
}

BookingStatus.propTypes = {
  bookingId: PropTypes.string.isRequired
}

export default BookingStatus;
