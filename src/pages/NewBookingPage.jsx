import { useState } from 'react'
import { motion } from "motion/react";
import { useAuthentication } from '../AuthenticationContext';
import { useNavigation } from '../NavigationContext';
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import { fullAddress } from '../utils';

function NewBookingPage() {
	const [bookingState, setBookingState] = useState('fill-form');
	const [error, setError] = useState(null);
	const { isAuthenticated, token, user } = useAuthentication();
	const { navigate } = useNavigation();

	const handleFormSubmit = async (formData) => {
		if (!isAuthenticated) {
			// Save form data to localStorage
			localStorage.setItem('pendingBookingData', JSON.stringify(formData));
			// Navigate to login
			navigate('/login', { returnTo: '/book' });
			return;
		}
		console.log(formData);

		try {
			const response = await fetch('http://localhost:3000/book', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({...formData, userId: user.id, fullAddress: fullAddress(formData.address)})
			});

			console.log("response: ", response);

			if (!response.ok) {
				throw new Error('Booking failed');
			}

			setBookingState('thank-you');
			// Clear saved form data after successful booking
			localStorage.removeItem('pendingBookingData');
		} catch (error) {
			console.error('Error submitting booking:', error);
			setError('Failed to submit booking. Please try again.');
			throw error;
		}
	};

	const renderBookingState = () => {
		switch(bookingState) {
			case 'fill-form':
				return (
					<motion.div 
						id="booking-form-container"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className="w-[100vw] lg:w-[100%] overflow-hidden items-center px-2 place-items-enter self-center"
					>
						{error && (
							<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
								<p className="text-red-600">{error}</p>
							</div>
						)}
						<BookingFormDetails onSubmit={handleFormSubmit} />
					</motion.div>
				);
			case 'thank-you':
				return <ThankYouBooked />;
			default:
				return <div>Unknown booking state: {bookingState}</div>;
		}
	};

	return (
		<div className="bg-white min-h-[100vh] flex flex-col place-items-enter">
			{renderBookingState()}
		</div>
	);
}

export default NewBookingPage;
