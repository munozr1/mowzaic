import AddressAutofillBar from '../components/AddressAutofillBar'
import {  useState } from 'react'
import DayCard from '../components/DayCard';
import BookingForm from '../components/BookingForm';
import ThankYouBooked from './ThankYouBooked';
import {motion} from "motion/react";

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
	const [selected, setSelected] = useState({})
	const [selectedAddress, setSelectedAddress] = useState(null)
	//const { navigate } = useNavigation();
	const [bookingState, setBookingState] = useState('address')


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
	
	const handleSelectAddress = (address) => {
		//const [lat, lon] = address.coordinates;
		const inrange = isInPlano(address.city)
		if (!inrange) {
			alert('We currently only service Plano, Texas')
			return
		}
		setSelectedAddress(address)
		fetchBookings()
		setBookingState('fill-form')
	}

	const handleSelectBookingDate = (data) => {
		setSelected(data);
		const id = `day-${data.id}`;
		document.getElementById(id).scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});

	}
	const handleBook = async (bookingFormData) => {
		if (selected == {}) {
			alert("You must select a date");
			document.getElementById("choose-date-message").classList.toggle("text-red-500");
			return

		}
		const data = {...selected, ...bookingFormData, ...selectedAddress}
		//post data to server
		const res = await fetch('http://localhost:3000/book', {
			method: 'POST',
			//credentials: 'include', //TODO: add credentials
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})

		console.log(await res.json())
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
				transition={{ duration: 0.6 , delay: 0.8}}
				//className="max-w-2xl mx-auto"
				className="items-center px-2  w-[100vw] lg:w-[50%] self-center "
			      >
					<div id="gayTrick" className="snap-x p-2 overflow-x-scroll  h-[8rem] flex flex-col no-scrollbar ">
						<div id="calendarContainer" className="p1 no-scrollbar  mt-5 flex ">
							{availability.map((d, index) => (
								<DayCard 
								key={index}
								idx={index}
								day= {new Date(d)}
								selected={selected}
								onSelect={handleSelectBookingDate}
								/>
							)) }
						</div>
					</div>
					<p className="text-gray-400 text-center" id="choose-date-message">please select a date</p>
					<div className="mb-5">
					<BookingForm onBook={handleBook} />
					</div>
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
			<div
			id="header"
			className={`bg-[#2EB966] flex flex-col transition-all duration-600  rounded-b-2xl lg:rounded-none  ${bookingState === "address" ? "lg:h[30rem]" : "h[12rem]"}`}
			>
				<div className={`mt-5 flex flex-wrap transition-all duration-500 ${bookingState == "address" ? 'mt-[5rem] ': ''} h-[4.5rem] mb-2  justify-center `}>
					<h1 className="text-2xl  lg:text-4xl font-mono font-bold mr-3">mow delivered,</h1>
					<h1 className="text-2xl lg:text-4xl font-mono font-bold mr3">just like that.</h1>
				</div>
				<div className="mt-0  flex lg:w-full justify-center ">
					<AddressAutofillBar
					onSelect={handleSelectAddress}
					/>
				</div>
				<div className="mt-2 mb-8 flex lg:w-full justify-center ">
					<button className={`${bookingState === "fill-form" ? 'hidden' : ''} lg:w-[24rem] text-white font-mono font-bold bg-black rounded-md w-[20rem] h-[2.5rem]`}>start booking</button>	
				</div>
			</div>
		{renderBookingState()}
		</div>
	)
}

export default NewBookingPage;
