import { useState, useEffect } from 'react'
import { motion } from "motion/react";
import { useAuthentication } from '../AuthenticationContext';
import { useNavigation } from '../NavigationContext';
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import { fullAddress, encodeJson, getParam } from '../utils';
import CheckoutForm from '../components/CheckoutForm';
function NewBookingPage() {
	const [bookingState, setBookingState] = useState('fill-form');
	const [error, setError] = useState(null);
	const [bookingData, setBookingData] = useState(null);
	const { isAuthenticated, token, user } = useAuthentication();
	const { navigate } = useNavigation();

	useEffect(() => {
		const booking = getParam('booking');
		if (booking) {
			setBookingState('booking-status');
		}
	}, []);

	const handleFormSubmit = async (formData) => {
		if (!isAuthenticated) {
			console.log("formData: ", formData);
			
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
			const response = await fetch('http://localhost:3000/book', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({...formData, userId: user.id, fullAddress: fullAddress(formData.selectedAddress)})
			});

			console.log("response: ", response);

			if (!response.ok) {
				throw new Error('Booking failed');
			}

			const bookingResult = await response.json();
			setBookingData(bookingResult);

			localStorage.setItem('bookingData', JSON.stringify(bookingResult));
			console.log("bookingData: ", bookingResult);
			
			// Move to checkout state instead of thank-you
			setBookingState('checkout');
			
		} catch (error) {
			console.error('Error submitting booking:', error);
			setError('Failed to submit booking. Please try again.');
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
				return <div>Booking Status</div>;
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
