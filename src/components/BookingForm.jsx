import { useState, useEffect } from "react"; import PropTypes from 'prop-types';
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import {useForm} from "react-hook-form";
import AccessCode from "./AcessCode";
import { getParam , decodeJson} from "../utils";
import AddressAutofillBar from "./AddressAutofillBar";
import DayCard from "./DayCard";



function gen14days(){
	const today = new Date();  
	const availability = Array.from({ length: 14 }, (_, i) => {  
	    let date = new Date();  
	    date.setDate(today.getDate() + i + 1); // Start from tomorrow  
	    return date.toISOString();  
	});  

	return availability

}

const BookingFormDetails = ({onBook}) => {
  const [accessCodes, setAccessCodes] = useState([{ id: 1, label: "", code: "" }]);// TODO: optimize this, change update this directly
  const [selectedOptions, setSelectedOptions] = useState([]);
  const { handleSubmit, register,  watch, formState: { errors } } = useForm();
  const additionalOptions = ['call on arrival', 'text on arrival', 'no contact', 'all electric']
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



	const handleChangeAddress = (data) => {
		setSelectedAddress(data)
	}
	
	const handleSelectBookingDate = (data) => {
		setSelectedDate(data);
		const id = `day-${data.id}`;
		document.getElementById(id).scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});

	}
	
  const onSubmit = (data) => {
	const codes = accessCodes.map(code => {
		return {
			label: document.getElementById(`label-${code.id}`).value,
			code: document.getElementById(`code-${code.id}`).value
		}
	});
	console.log({...data, codes});
	onBook({...data, codes})
    // Handle form submission here
  };
  const toggleOptions = (op) => {
	  let newOptions = [...selectedOptions]
	  if (newOptions.includes(op)) {
		  newOptions = newOptions.filter(i => i != op)
	  }else{
		  newOptions.push(op)
	  }

	  setSelectedOptions(newOptions)

  }
  const addAccessCode= () => {
	if(accessCodes.length >= 5) return;
	  setAccessCodes((prevCodes) => [
	    ...prevCodes,
	    { id: prevCodes.length + 1, label: "", code: "" },
	  ]);
  };
  const removeAccessCode = (id) => {
    setAccessCodes((prevCodes) => prevCodes.filter((code) => code.id !== id));
    
  };
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12  ">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="max-w-2xl mx-auto"
      >
	<div className="shadow mt-5 self-center">
						<AddressAutofillBar initialAddress={selectedAddress} onSelect={handleChangeAddress}/>
					</div>
					<p className="text-red-500 textcenter hidden" id="choose-address-message">* please select a date</p>
					<div id="gayTrick" className="snap-x p-2 overflow-x-scroll  h-[8rem] flex justify-center flex-col no-scrollbar ">
						<div id="calendarContainer" className="p1 no-scrollbar  mt-5 flex ">
							{availability.map((d, index) => (
								<DayCard 
								key={index}
								idx={index}
								day= {new Date(d)}
								selected={selectedDate}
								onSelect={handleSelectBookingDate}
								/>
							)) }
						</div>
					</div>
					<p className="text-red-500 text-center hidden" id="choose-date-message">* please select a date</p>
					<div className=" mt-5 flex flex-wrap">
						{timeSlots.map((slot, index)=> {
							return (<button
								key={index}
								id={`slot-${index}`}
								type="button"
								onClick={() => setTimeSlot(index)}
								className={`mr-5 mb-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
								  timeSlot === index
								    ? "bg-[#2EB966] text-white"
								    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
							>
							{slot}
						      </button>)
						})
						}
					</div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Address Input */}
          {/* Pets Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="mr-2 rounded text-[#2EB966] focus:ring-[#2EB966]"
                {...register("hasPets")}
              />
	  {"are there any pets? even if they're friendly it's important to know."}
            </label>
          </div>
          {/* Contact Preference */}
          <div className="space-y-2">
            <p className="block text-sm font-medium text-gray-700">
              preferred contact method
            </p>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="text-[#2EB966] focus:ring-[#2EB966]"
                  value="call"
                  {...register("preferredContact", { required: true })}
                />
                <span className="ml-2">call</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="text-[#2EB966] focus:ring-[#2EB966]"
                  value="text"
                  {...register("preferredContact", { required: true })}
                />
                <span className="ml-2">text</span>
              </label>
            </div>
            {errors.preferredContact && (
              <p className="text-red-500 text-sm">please select a contact method</p>
            )}
          </div>
          {/* Phone Number */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              phone number
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-green-600 "
              placeholder="(123) 456-7890"
	      autoComplete="off"
	      inputMode="numeric"
              {...register("phoneNumber", { required: true, pattern: {message: "Enter valid phone number", value: /^[0-9]{10}$/}})}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">phone number is required</p>
            )}
          </div>
          {/* Access Codes */}
          <div className="space-y-2 ">
            <p className="block text-sm font-medium text-gray-700">
              access codes (if any)
            </p>
	    {accessCodes.map(({id}) => (
	     <AccessCode key={id} index={id} onDelete={removeAccessCode} />
            ))}
            <button
              type="button"
              onClick={addAccessCode}
              className="hover:cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-[#2EB966] hover:text-[#2EB966]/80"
            >
              <Plus size={20} className="mr-2" />
              add another access code
            </button>
          </div>
	   {/* OPTIONS */}
	<div className="mt-5 flex flex-wrap">
		{additionalOptions.map((op, index)=> {
			return (<button
				key={index}
				id={`option-${index}`}
				type="button"
				onClick={() => toggleOptions(op)}
				className={`hover:cursor-pointer mr-5 mb-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedOptions.includes(op)? "bg-[#2EB966] text-white": "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
				>
				{op}
				</button>)
			})
		}
		</div>
          {/* Delivery Instructions */}
          <div className="space-y-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
	    additional instructions to providers
            </label>
            <textarea
              id="instructions"
              className="w-full px-4 py-2 border border-gray-300 rounded-md  focus:outline-green-600"
              placeholder="example: make sure to get under the trampoline"
              maxLength={500}
              rows={4}
              {...register("message")}
            />
            <p className="text-sm text-gray-500">
              {watch("message")?.length || 0}/500 characters
            </p>

	  	
          </div>
          {/* Submit Button */}
          <button
            type="submit"
	    //onClick={() => onBook(onSubmit())}
            className="w-full px-6 py-3 text-white bg-[#2EB966] rounded-md hover:bg-[#2EB966]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2EB966]"
          >
	  Book
          </button>
        </form>
      </motion.div>
    </div>
  );
};

BookingFormDetails.propTypes = {

    onBook: PropTypes.func.isRequired,
}

export default BookingFormDetails;
