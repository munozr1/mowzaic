import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MAPBOX_TOKEN, MAPBOX_URL } from "../constants";

const AddressAutofillBar = ({ onSelect, initialAddress }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [userLocation, setUserLocation] = useState({});

  useEffect(() => {
    console.log("initialAddress",{...initialAddress})
    if (initialAddress?.address) {
      setQuery(initialAddress.address + ' ' + initialAddress.city + ', ' + initialAddress.state+ ', ' + initialAddress.postal);
    }
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(setUserLocation);
  }, [initialAddress]);

  useEffect(() => { return }, [userLocation]);

  const fetchSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    let url = `${MAPBOX_URL}${encodeURIComponent(input)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=us&limit=5&types=address&bbox=-106.645646,25.837164,-93.508039,36.500704`;
    if (userLocation.coords) {
      url = `${MAPBOX_URL}${encodeURIComponent(input)}.json?` +
        `access_token=${MAPBOX_TOKEN}` +
        `&autocomplete=true` +
        `&country=us` +
        `&limit=5` + 
        `&types=address` +
        `&proximity=${userLocation.coords.longitude},${userLocation.coords.latitude}`;
    }

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
  };

  return (
    <div className="rounded-md w-full w[20rem] lg:w[24rem] flex justify-left bg-white relative l">
      <input
        id="address-autofill-input"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.length < 4) return;
          fetchSuggestions(e.target.value);
        }}
        placeholder="Enter address"
        className="w-full px-3 py-1.5 text-base focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-400"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 shadow-md rounded-md mt-12">
          {suggestions.map((place) => (
            <li
              key={place.id}
              className="px-3 py-2 cursor-pointer border-b border-gray-400 hover:bg-gray-100"
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

AddressAutofillBar.propTypes = {
  onSelect: PropTypes.func.isRequired,
  initialAddress: PropTypes.object
};

AddressAutofillBar.defaultProps = {
  initialAddress: {}
};

export default AddressAutofillBar;



