import AddressAutofillBar from '../components/AddressAutofillBar'
import {  useState } from 'react'
import DayCard from '../components/DayCard';
import BookingForm from '../components/BookingForm';
import { MAPBOX_TOKEN, MAPBOX_URL } from '../constants';



function gen14days(){
	const today = new Date();  
	const availability = Array.from({ length: 14 }, (_, i) => {  
	    let date = new Date();  
	    date.setDate(today.getDate() + i + 1); // Start from tomorrow  
	    return date.toISOString();  
	});  

	return availability

}



function Home() {
	const [availability, setAvailability] = useState(gen14days())
	const [selected, setSelected] = useState(null)
	const [selectedAddress, setSelectedAddress] = useState(null)

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
	}

	const handleSelectBookingDate = (index) => {
		setSelected(index);
		const id = `day-${index}`;
		document.getElementById(id).scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});

	}
	const handleBook = async (bookingFormData) => {
		const data = {selected, ...bookingFormData, ...selectedAddress}
		//post data to server
		const res = await fetch('http://localhost:3000/book', {
			method: 'POST',
			//credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})

		console.log(await res.json())

	}

	return (
		<div className=" bg-white flex flex-col  place-items-enter ">
			<div className="bg-[#2EB966]">
				<div className="mt-8 flex flex-wrap  justify-center h-[5rem]  ">
					<h1 className="text-2xl  font-mono font-bold mr-3">Mow delivered,</h1>
					<h1 className="text-2xl font-mono font-bold mr3">just like that.</h1>
				</div>
				<div className="mt-5 mb-5 flex lg:w-full justify-center ">
					<AddressAutofillBar
					onSelect={handleSelectAddress}
					/>
				</div>
			</div>
			<div id="booking-form-container" className="items-center px-8  w-[100vw] lg:w-[50%] self-center ">
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
				<div className="mb-5">
					<BookingForm onBook={handleBook} />
				</div>
			</div>
		
		</div>
	)
}

export default Home 
