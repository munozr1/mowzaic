import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MAPBOX_TOKEN, MAPBOX_URL } from "../constants";

const AddressAutofillBar = ({ onSelect, initialAddress }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [userLocation, setUserLocation] = useState({});
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialAddress?.address) {
      setQuery(
        initialAddress.address +
          " " +
          initialAddress.city +
          ", " +
          initialAddress.state +
          ", " +
          initialAddress.postal
      );
    }
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(setUserLocation);
  }, [initialAddress]);

  useEffect(() => {
    return;
  }, [userLocation]);

  const fetchSuggestions = async (input) => {
    if (!input) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let url =
      `${MAPBOX_URL}${encodeURIComponent(input)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=us&limit=5&types=address&bbox=-106.645646,25.837164,-93.508039,36.500704`;
    if (userLocation.coords) {
      url =
        `${MAPBOX_URL}${encodeURIComponent(input)}.json?` +
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
      const feats = data.features || [];
      setSuggestions(feats);
      setOpen(feats.length > 0);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
      setOpen(false);
    }
  };

  const extractAddressDetails = (place) => {
    return {
      address: place.address ? `${place.address} ${place.text}` : place.text,
      city:
        place.context?.find((c) => c.id.startsWith("place"))?.text || "",
      postal:
        place.context?.find((c) => c.id.startsWith("postcode"))?.text || "",
      state:
        place.context?.find((c) => c.id.startsWith("region"))?.text || "",
      coordinates: place.center || [],
    };
  };

  const handleSelect = (place) => {
    setQuery(place.place_name);
    setSuggestions([]);
    setOpen(false);
    onSelect(extractAddressDetails(place));
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className=" rounded-md w-full w[20rem] lg:w[24rem] flex justify-left bg-white relative"
    >
      <input
        ref={inputRef}
        id="address-autofill-input"
        type="text"
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          if (val.length < 4) {
            setSuggestions([]);
            setOpen(false);
            return;
          }
          fetchSuggestions(val);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder="Enter address"
        className="w-full px-3 py-1.5 text-base focus:ring-0 focus:outline-none text-gray-900 placeholder:text-gray-400"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 shadow-md rounded-md mt-12">
          {suggestions.map((place) => (
            <li
              key={place.id}
              className="px-3 py-2 cursor-pointer border-b border-gray-400 hover:bg-gray-100"
              onMouseDown={(e) => e.preventDefault()} // prevent input blur race
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
  initialAddress: PropTypes.object,
};

AddressAutofillBar.defaultProps = {
  initialAddress: {},
};

export default AddressAutofillBar;



