import { useState, useEffect } from 'react'
import { motion } from "motion/react";
import { useAuthentication } from '../AuthenticationContext';
import { useNavigation } from '../NavigationContext';
import { useLoginModal } from '../LoginModalContext';
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import { fullAddress, encodeJson, getParam } from '../utils';
import CheckoutForm from '../components/CheckoutForm';
import BookingStatus from '../components/BookingStatus';
import { BACKEND_URL } from '../constants';
import { TARGET_CITIES } from '../constants/serviceAreas';
import { toast, Toaster } from "sonner";

function NewBookingPage() {
	const [bookingState, setBookingState] = useState('fill-form');
	const [error, setError] = useState(null);
	//const [, setBookingData] = useState(null);
	const { isAuthenticated, token, user } = useAuthentication();
	const { navigate } = useNavigation();
	const { openLoginModal } = useLoginModal();
	const [bookingId, setBookingId] = useState(null);

	useEffect(() => {
		const booking = getParam('booking');
		if (booking) {
			setBookingState('booking-status');
			setBookingId(booking);
		}
	}, []);

	const trackDemand = async (status, formData) => {
		try {
			const fullAddr = fullAddress(formData.selectedAddress);
			await fetch('/api/track-demand', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					address: fullAddr,
					city: formData.selectedAddress.city,
					state: formData.selectedAddress.state,
					postal: formData.selectedAddress.postal,
					phone: formData.phoneNumber,
					privacyAgreement: formData.privacyAgreement,
					marketingConsent: formData.marketingConsent
				})
			});
		} catch (err) {
			console.error("Failed to track demand", err);
		}
	};

	const handleFormSubmit = async (formData) => {
		// 1. Check City Eligibility (Waitlist Gate)
		const city = formData.selectedAddress.city;
		const normalizedCity = city?.trim().toLowerCase();
		const isTargetCity = TARGET_CITIES.some(c => c.toLowerCase() === normalizedCity);

		if (!isTargetCity) {
			// This is a Dallas County resident who is NOT in Mesquite/Garland.
			// We track them as waitlisted (now capturing phone #) and stop the booking.
			toast.info(`We waitlisted you! We are coming to ${city} soon!`);
			await trackDemand('waitlisted', formData);
			return; // Stop execution, do not proceed to booking/checkout
		}

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
			// Store the data and open login modal instead of navigating
			navigate(window.location.pathname, { gt: encodedData });
			openLoginModal();
			return;
		}
		try {
			const response = await fetch(`${BACKEND_URL}/book`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ ...formData, userId: user.id, fullAddress: fullAddress(formData.selectedAddress) })
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

			// Track successful booking
			await trackDemand('accepted_booked', formData);

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
		switch (bookingState) {
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
			<Toaster position="top-center" />
			{renderBookingState()}
		</div>
	);
}

export default NewBookingPage;
