import { useState } from 'react'
import { motion } from "motion/react";
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';

function NewBookingPage() {
	const [bookingState, setBookingState] = useState('fill-form');

	const handleFormSubmit = async (formData) => {
		try {
			const response = await fetch('http://localhost:3000/book', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				throw new Error('Booking failed');
			}

			setBookingState('thank-you');
		} catch (error) {
			console.error('Error submitting booking:', error);
			// Handle error appropriately (e.g., show error message to user)
		}
	};

	const renderBookingState = () => {
		switch(bookingState) {
			case 'fill-form':
				return (
					<div 
						id="booking-form-container"
						/*initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						*/
						className="w-[100vw] lg:w-[100%] overflow-hidden items-center px-2 place-items-enter self-center"
					>
						<BookingFormDetails onSubmit={handleFormSubmit} />
					</div>
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
