import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { motion } from "motion/react";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import AccessCode from "./AcessCode";
import AddressAutofillBar from "./AddressAutofillBar";
import DayCard from "./DayCard";
import { decodeJson, getParam } from "../utils";

function gen14days() {
  const today = new Date();  
  const availability = Array.from({ length: 14 }, (_, i) => {  
    let date = new Date();  
    date.setDate(today.getDate() + i + 1); // Start from tomorrow  
    return date.toISOString();  
  });  
  return availability;
}

const BookingFormDetails = ({ onSubmit }) => {
  const [accessCodes, setAccessCodes] = useState([{ id: 1, label: "", code: "" }]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState({});
  const [selectedDate, setSelectedDate] = useState({});
  const [timeSlot, setTimeSlot] = useState(3);
  const [availability] = useState(gen14days());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { handleSubmit, register, watch, formState: { errors }, setValue } = useForm();
  const additionalOptions = ['call on arrival', 'text on arrival', 'no contact', 'all electric'];
  const timeSlots = ['early (7am-9am)', 'mid (10am-12pm)', 'late (1pm-4pm)', 'anytime'];

  useEffect(() => {
    // Try to load saved form data
    const savedData = localStorage.getItem('pendingBookingData');
    if (savedData) {
      const data = JSON.parse(savedData);
      // Restore form data
      if (data.selectedAddress) setSelectedAddress(data.selectedAddress);
      if (data.selectedDate) setSelectedDate(data.selectedDate);
      if (data.timeSlot !== undefined) setTimeSlot(data.timeSlot);
      if (data.selectedOptions) setSelectedOptions(data.selectedOptions);
      if (data.codes) setAccessCodes(data.codes.map((code, index) => ({ ...code, id: index + 1 })));
      
      // Restore form values
      if (data.phoneNumber) setValue('phoneNumber', data.phoneNumber);
      if (data.preferredContact) setValue('preferredContact', data.preferredContact);
      if (data.hasPets !== undefined) setValue('hasPets', data.hasPets);
      if (data.message) setValue('message', data.message);
    } else {
      // Load address from URL parameter if no saved data
      let address = getParam('gt')
      if (address) {
        address = decodeJson(address)
        if (address.address) {
          setSelectedAddress(address)
        }
      }
    }
  }, [setValue]);

  const handleChangeAddress = (data) => {
    setSelectedAddress(data);
  };
  
  const handleSelectBookingDate = (data) => {
    setSelectedDate(data);
    const id = `day-${data.id}`;
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const handleFormSubmit = async (data) => {
    if (!selectedAddress.address) {
      const addressErr = document.getElementById("choose-address-message");
      addressErr.classList.remove("hidden");
      return;
    } else {
      document.getElementById("choose-address-message").classList.add('hidden');
    }
    
    if (!selectedDate.id) {
      const dateErr = document.getElementById("choose-date-message");
      dateErr.classList.remove("hidden");
      return;
    } else {
      document.getElementById("choose-date-message").classList.add('hidden');
    }

    setIsSubmitting(true);

    const codes = accessCodes.map(code => ({
      label: document.getElementById(`label-${code.id}`).value,
      code: document.getElementById(`code-${code.id}`).value
    }));
    
    try {
      await onSubmit({
        ...data,
        codes,
        selectedOptions,
        selectedAddress,
        selectedDate,
        timeSlot
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      setIsSubmitting(false);
    }
  };

  const toggleOptions = (op) => {
    let newOptions = [...selectedOptions];
    
    // Handle mutual exclusivity between call and text options
    if (op === 'call on arrival') {
      // If selecting call, remove text if present
      newOptions = newOptions.filter(i => i !== 'text on arrival');
    } else if (op === 'text on arrival') {
      // If selecting text, remove call if present
      newOptions = newOptions.filter(i => i !== 'call on arrival');
    }

    // Toggle the selected option
    if (newOptions.includes(op)) {
      newOptions = newOptions.filter(i => i !== op);
    } else {
      newOptions.push(op);
    }

    setSelectedOptions(newOptions);
  };

  const addAccessCode = () => {
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
    <div className="min-h-screen bg-[#FFFFFF] py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
        className="max-w-2xl mx-auto relative"
      >
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#2EB966]" />
              <p className="text-gray-700 font-medium">Processing your booking...</p>
            </div>
          </div>
        )}

        <div className="shadow mt-5 self-center">
          <AddressAutofillBar initialAddress={selectedAddress} onSelect={handleChangeAddress} />
        </div>
        <p className="text-red-500 text-center hidden" id="choose-address-message">* please select an address</p>
        
        <div id="calendar-container" className="snap-x p-2 overflow-x-scroll h-[8rem] flex justify-center flex-col no-scrollbar">
          <div id="calendarContainer" className="p1 no-scrollbar mt-5 flex">
            {availability.map((d, index) => (
              <DayCard 
                key={index}
                idx={index}
                day={new Date(d)}
                selected={selectedDate}
                onSelect={handleSelectBookingDate}
              />
            ))}
          </div>
        </div>
        <p className="text-red-500 text-center hidden" id="choose-date-message">* please select a date</p>

        <div className="mt-5 flex flex-wrap">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              id={`slot-${index}`}
              type="button"
              onClick={() => setTimeSlot(index)}
              disabled={isSubmitting}
              className={`mr-5 mb-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeSlot === index
                  ? "bg-[#2EB966] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {slot}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Pets Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="mr-2 rounded text-[#2EB966] focus:ring-[#2EB966]"
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  {...register("preferredContact", { required: true })}
                />
                <span className="ml-2">call</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="text-[#2EB966] focus:ring-[#2EB966]"
                  value="text"
                  disabled={isSubmitting}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-green-600"
              placeholder="(123) 456-7890"
              autoComplete="off"
              inputMode="numeric"
              disabled={isSubmitting}
              {...register("phoneNumber", { 
                required: true, 
                pattern: {
                  message: "Enter valid phone number", 
                  value: /^[0-9]{10}$/
                }
              })}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">phone number is required</p>
            )}
          </div>

          {/* Access Codes */}
          <div className="space-y-2">
            <p className="block text-sm font-medium text-gray-700">
              access codes (if any)
            </p>
            {accessCodes.map(({id}) => (
              <AccessCode key={id} index={id} onDelete={removeAccessCode} isSubmitting={isSubmitting} />
            ))}
            <button
              type="button"
              onClick={addAccessCode}
              disabled={isSubmitting}
              className="hover:cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium text-[#2EB966] hover:text-[#2EB966]/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} className="mr-2" />
              add another access code
            </button>
          </div>

          {/* Additional Options */}
          <div className="mt-5 flex flex-wrap">
            {additionalOptions.map((op, index) => (
              <button
                key={index}
                id={`option-${index}`}
                type="button"
                onClick={() => toggleOptions(op)}
                disabled={isSubmitting}
                className={`hover:cursor-pointer mr-5 mb-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedOptions.includes(op) 
                    ? "bg-[#2EB966] text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
              additional instructions to providers
            </label>
            <textarea
              id="instructions"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-green-600"
              placeholder="example: make sure to get under the trampoline"
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
              {...register("message")}
            />
            <p className="text-sm text-gray-500">
              {watch("message")?.length || 0}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 text-white bg-[#2EB966] rounded-md hover:bg-[#2EB966]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2EB966] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Book Now'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

BookingFormDetails.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

export default BookingFormDetails;
