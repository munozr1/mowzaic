//import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
//import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'
import AccessCode from './AcessCode';
import CheckboxOption from './CheckboxOption';
import PropTypes from 'prop-types';

export default function BookingForm({ onBook }) {
	const [messageLength, setMessageLength] = useState(0);
	const [hasPets , setHasPets] = useState(false);
	const [accessCodes, setAccessCodes] = useState([{ id: 1, label: "", code: "" }]);// TODO: optimize this, change update this directly
	const options = ['Call on arrival', 'Text on arrival'];
	const [selectedOptions, setSelectedOptions] = useState([]);
	const maxMessageLength = 500;
	const handleAddCode = () => {
		if(accessCodes.length >= 5) return;
		  setAccessCodes((prevCodes) => [
		    ...prevCodes,
		    { id: prevCodes.length + 1, label: "", code: "" },
		  ]);
	};
	const handleDeleteAccessCode = (id) => {
		setAccessCodes((prevCodes) => prevCodes.filter((code) => code.id !== id));
	}
	const handleCheckboxChange = (option) => {
		setSelectedOptions((prevSelected) =>
			prevSelected.includes(option) ? prevSelected.filter((o) => o !== option) : [...prevSelected, option]
		);
	}

	const handleSubmit = () => {
		const message = document.getElementById('message-to-providers').value;
		const codes = accessCodes.map(code => {
			return {
				label: document.getElementById(`label-${code.id}`).value,
				code: document.getElementById(`code-${code.id}`).value
			}
		});
		const data = {message, hasPets, codes, selectedOptions};
		return data

	}

  return (
    <form id="booking-form">
      <div className="space-y-12 sm:space-y-16">
        <div>
          <div className="">

            <div className="border-b border-gray-300 mb-5 py-2 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="about" className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5">
                Message to providers
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <textarea
                  id="message-to-providers"
	  	  placeholder="Ex: make sure to get under the trampoline"
                  name="about"
                  rows={3}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:max-w-2xl sm:text-sm/6"
                  defaultValue={''}
	  	  maxLength={500}
	  	  onChange={(e) => setMessageLength(e.target.value.length)}
                />
	  	<span className={`${messageLength === maxMessageLength ? 'text-red-400' : 'text-gray-400' }`}>{messageLength}/500</span>
              </div>
            </div>

	  {/*START ACCESS CODES*/}
	  <div id="access-codes" className=" p-2 mb-5 border-b border-gray-300 "> 
	  
		   
	  {accessCodes.map(({ id }) => (
		  <AccessCode key={id} id={id} onDelete={handleDeleteAccessCode} />
		
	      ))}

	  </div>
	  <div className="flex justify-center">
	  {/*END ACCESS CODES*/}

	  {/*ACCESS CODES BUTTON*/}
		  <button
	  	  className="shadow active:bg-gray-300 border border-gray-300 rounded-sm hover:cursor-pointer  w-[8rem]"
	  	  type="button"
	  	  onClick={handleAddCode}
		  > 
		  Add Code
		  </button></div>
	  {/*ACCESS CODES BUTTON*/}
	  </div>
        </div>

        <div>
          <h2 className="text-base/7 font-semibold text-gray-900">Pets</h2>
          <p className="mt-1 max-w-2xl text-sm/6 text-gray-600">
	  {"Are there any pets at this address? Even if they're friendly, it's important to know."}
          </p>
	  <div className="mt-4 grid grid-cols-2">
		  <div className="flex justify-center">
	  		<button onClick={() => setHasPets(true)}
	  		type="button" 
	  		className={` hover:cursor-pointer p-2 shadow w-[6rem] rounded-lg ${hasPets ? 'font-bold text-black bg-green-300 border border-green-600':'bg-white border border-gray-300 text-gray-900'}`}>
	  		YES
	  		</button>
		  </div>
		  <div className="flex justify-center">
	  		<button onClick={()=> setHasPets(false)} 
	  		type="button"
	  		className={`hover:cursor-pointer shadow w-[6rem] rounded-lg ${hasPets ? 'bg-white border border-gray-300 text-gray-900': 'font-bold text-black bg-green-300 border border-green-600'}`}>
	  		NO
	  		</button>
		  </div>
	  </div>

          <div className="mt-10 space-y-10 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
            <fieldset>
		<div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
		  { options.map((option, index) => ( <CheckboxOption key={index} id={index} name={option} onChange={ () => handleCheckboxChange(option)} />))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="text-sm/6 font-semibold text-gray-900">
          Cancel
        </button>
        <button
          type="button"
	  form="booking-form"
          className="inline-flex justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
	  onClick={() => onBook(handleSubmit())}
        >
          Book
        </button>
      </div>
    </form>
  )
}

BookingForm.propTypes = {
	onBook: PropTypes.func.isRequired,
}


