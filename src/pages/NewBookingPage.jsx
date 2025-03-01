import {  useEffect, useState } from 'react'
import DayCard from '../components/DayCard';
import BookingFormDetails from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import {motion} from "motion/react";
import { useNavigation } from '../NavigationContext';
import { decodeJson, getParam } from '../utils';
import AddressAutofillBar from '../components/AddressAutofillBar';

function gen14days(){
	const today = new Date();  
	const availability = Array.from({ length: 14 }, (_, i) => {  
	    let date = new Date();  
	    date.setDate(today.getDate() + i + 1); // Start from tomorrow  
	    return date.toISOString();  
	});  

	return availability

}



function NewBookingPage() {
	const [availability, setAvailability] = useState(gen14days())
	const [selectedDate, setSelectedDate] = useState({})
	const [selectedAddress, setSelectedAddress] = useState({})
	const [bookingState, setBookingState] = useState('address')
	const [timeSlot, setTimeSlot] = useState(3);

	const timeSlots = ['early (7am-9am)', 'mid (10am-12pm)', 'late (1pm-4pm)', 'anytime']

	useEffect(() => {
		setBookingState('fill-form');
		const gt = getParam('gt');
		if (!gt) {setSelectedAddress({}); return}
		setSelectedAddress(decodeJson(gt))
	},[]);


	const fetchBookings = async () => {
		const res = await fetch('http://localhost:3000/availability/this-week')
		const bookings = await res.json()
		const filteredAvailability = availability.filter(date => {
			const count = bookings.filter(booking => booking === date).length
			return count < 10
		})
		setAvailability(filteredAvailability)
		
	}

	function isInPlano(city) {
	  const cities = ['plano', 'mesquite', 'garland', 'dallas']
	  city = city.toLowerCase()
	  if (!city) return false;
	  if (cities.includes(city)) return true;
	  return false;
	}

	const handleChangeAddress = (data) => {
		setSelectedAddress(data)
	}
	
	const handleSelectBookingDate = (data) => {
		setSelectedDate(data);
		const id = `day-${data.id}`;
		document.getElementById(id).scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});

	}
	const handleBook = async (bookingFormData) => {
		if (!selectedAddress.address) {
			const addressErr = document.getElementById("choose-address-message")
			addressErr.classList.remove("hidden");
			return

		} else {document.getElementById("choose-address-message").classList.add('hidden')}
		if (!selectedDate.id) {
			const dateErr = document.getElementById("choose-date-message")
			dateErr.classList.remove("hidden");
			return

		} else {document.getElementById("choose-date-message").classList.add('hidden')}
		const data = {timeSlot,...selectedDate, ...bookingFormData, ...selectedAddress}
		//post data to server
		const res = await fetch('http://localhost:3000/book', {
			method: 'POST',
			//credentials: 'include', //TODO: add credentials
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
		console.log(res) //TODO: do not log

		//navigate('/thank-you')
		setBookingState('thank-you')

	}
	

	const renderBookingState = () => {
		switch(bookingState){
			case 'address':
				return (<></>)
			case 'fill-form':
				return (
				<motion.div id="booking-form-container"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 , delay: 0.5}}
				//className="max-w-2xl mx-auto"
				className="w-[100vw] lg:w-[100%] overflow-hidden items-center px-2 place-items-enter self-center "
			      >
					<BookingFormDetails onBook={handleBook} />
				</motion.div>
				)
			case 'thank-you':
				return (<ThankYouBooked/>)
			default:
				return (<div> unknown bookingState {bookingState}</div>)
		}

	}

	return (
		<div className=" bg-white min-h-[100vh] flex flex-col  place-items-enter ">
		{renderBookingState()}
		</div>
	)
}

export default NewBookingPage;
