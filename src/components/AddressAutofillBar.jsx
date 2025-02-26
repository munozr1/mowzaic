import { useState } from "react";
import PropTypes from "prop-types";
import { MAPBOX_TOKEN, MAPBOX_URL } from "../constants";

const AddressAutofillBar = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    const url = `${MAPBOX_URL}${encodeURIComponent(input)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=us&limit=5&types=address&bbox=-106.645646,25.837164,-93.508039,36.500704`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    }
  };

const extractAddressDetails = (place) => {
  return {
    address: place.address ? `${place.address} ${place.text}` : place.text, // Full street address
    city: place.context?.find((c) => c.id.startsWith("place"))?.text || "", // City
    postal: place.context?.find((c) => c.id.startsWith("postcode"))?.text || "", // Postal Code
    state: place.context?.find((c) => c.id.startsWith("region"))?.text || "", // State
    coordinates: place.center || [], // [longitude, latitude]
  };
};


  const handleSelect = (place) => {
    setQuery(place.place_name);
    setSuggestions([]);
    onSelect(extractAddressDetails(place)); // Send selected address to parent
    console.log(extractAddressDetails(place));
  };

  return (
    <div className="border p-1 rounded-md w-[20rem] flex justify-left bg-white  relative l">
	  <svg className="self-center ml-5" width="25" height="28" viewBox="0 0 73 68" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M34.9302 62.854C35.0209 62.9031 35.0922 62.941 35.1427 62.9675L35.2266 63.0112C35.8959 63.3543 36.7262 63.3517 37.3962 63.0123L37.4823 62.9675C37.5328 62.941 37.6041 62.9031 37.6948 62.854C37.8762 62.7559 38.1354 62.6128 38.4614 62.4254C39.113 62.0507 40.0329 61.4983 41.1317 60.7735C43.3256 59.3264 46.2528 57.1794 49.1864 54.3748C55.0253 48.793 61.09 40.4064 61.09 29.6208C61.09 16.8437 49.9967 6.48584 36.3125 6.48584C22.6283 6.48584 11.535 16.8437 11.535 29.6208C11.535 40.4064 17.5997 48.793 23.4386 54.3748C26.3722 57.1794 29.2995 59.3264 31.4933 60.7735C32.5921 61.4983 33.512 62.0507 34.1636 62.4254C34.4896 62.6128 34.7488 62.7559 34.9302 62.854ZM36.3125 38.0336C41.2886 38.0336 45.3225 34.2671 45.3225 29.6208C45.3225 24.9746 41.2886 21.2081 36.3125 21.2081C31.3364 21.2081 27.3025 24.9746 27.3025 29.6208C27.3025 34.2671 31.3364 38.0336 36.3125 38.0336Z" fill="#0F172A"/></svg>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
	  if (e.target.value.length < 4) return;
          fetchSuggestions(e.target.value);
        }}
        placeholder="Enter address"
        className=" w-full px-3 py-1.5 text-base focus:ring-0 focus:outline-none  text-gray-900 placeholder:text-gray-400 "
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 shadow-md rounded-md mt-12">
          {suggestions.map((place) => (
            <li
              key={place.id}
              className="px-3 py-2 cursor-pointer border-b- border-gray-200 hover:bg-gray-100"
              onClick={() => handleSelect(place)}
            >
              {place.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


AddressAutofillBar.defaultProps = {
  onSelect: PropTypes.func.isRequired,
};

export default AddressAutofillBar;



