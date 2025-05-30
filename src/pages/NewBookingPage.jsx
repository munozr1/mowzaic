import { useState, useEffect } from 'react'
import { motion } from "motion/react";
import { useAuthentication } from '../AuthenticationContext';
import { useNavigation } from '../NavigationContext';
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import { fullAddress, encodeJson, getParam } from '../utils';
import CheckoutForm from '../components/CheckoutForm';
import BookingStatus from '../components/BookingStatus';
import { BACKEND_URL } from '../constants';

function NewBookingPage() {
	const [bookingState, setBookingState] = useState('fill-form');
	const [error, setError] = useState(null);
	//const [, setBookingData] = useState(null);
	const { isAuthenticated, token, user } = useAuthentication();
	const { navigate } = useNavigation();
	const [bookingId, setBookingId] = useState(null);

	useEffect(() => {
		const booking = getParam('booking');
		if (booking) {
			setBookingState('booking-status');
			setBookingId(booking);
		}
	}, []);

	const handleFormSubmit = async (formData) => {
		if (!isAuthenticated) {
			
			// Ensure codes are properly formatted before encoding
			const formDataWithCleanCodes = {
				...formData,
				codes: formData.codes.map(code => ({
					label: code.label || "",
					code: code.code || ""
				}))
			};
			
			const encodedData = encodeJson(formDataWithCleanCodes);
			navigate('/login', { gt: encodedData });
			return;
		}
		try {
			const response = await fetch(`${BACKEND_URL}/book`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({...formData, userId: user.id, fullAddress: fullAddress(formData.selectedAddress)})
			});


			if (!response.ok) {
				const errorData = await response.json();
				setError(errorData.details || 'Failed to submit booking. Please try again.');
				throw new Error(errorData.details || 'Failed to submit booking. Please try again.');
			}

			const bookingResult = await response.json();
			console.log(bookingResult);

			localStorage.setItem('bookingData', JSON.stringify(bookingResult));
			
			// Move to checkout state instead of thank-you
			setBookingState('checkout');
			
		} catch (error) {
			window.scrollTo(0, 0);
			console.error('Error submitting booking:', error);
			throw error;
		}
	};

	const handlePaymentSuccess = () => {
		// Clear saved form data after successful payment
		localStorage.removeItem('pendingBookingData');
		// Move to thank you state
		setBookingState('thank-you');
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
			case 'checkout':
				return (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="w-[100vw] lg:w-[100%] overflow-hidden items-center px-2 place-items-enter self-center"
					>
						<CheckoutForm 
							onPaymentSuccess={handlePaymentSuccess} 
						/>
					</motion.div>
				);
			case 'booking-status':
				return <BookingStatus bookingId={bookingId} updateBookingState={setBookingState} />;
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
