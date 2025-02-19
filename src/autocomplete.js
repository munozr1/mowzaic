import { MapboxAddressAutofill } from '@mapbox/search-js-web'
// instantiate a <mapbox-address-autofill> element using the MapboxAddressAutofill class
const location = { }
const autofillElement = new MapboxAddressAutofill()


const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
autofillElement.accessToken = mapboxToken


// set the <mapbox-address-autofill> element's options
autofillElement.options = {
    country: 'us',
    limit: 3
}

autofillElement.confirmOnBrowserAutofill = {
  minimap: true,
  skipConfirmModal: (feature) =>
    ['exact', 'high'].includes(
      feature.properties.match_code.confidence
    )
};

const the_input = document.getElementById('address-input');
const the_form = the_input.parentElement

// append the <input> to <mapbox-address-autofill>
autofillElement.appendChild(the_input);
// append <mapbox-address-autofill> to the <form>
the_form.appendChild(autofillElement);
// Add an event listener for the 'retrieve' event
autofillElement.addEventListener('retrieve', (event) => {
    // Extract the selected address feature
    const feature = event.detail.features[0];
    const [longitude, lattitude] = feature.geometry.coordinates
    location.longitude = longitude
    location.lattitude = lattitude

    // Log all properties of the selected address
    //location.Full Address:', feature.properties.full_address);
    location.street = feature.properties.address_line1
    location.city= feature.properties.address_level2
    location.state = feature.properties.address_level1
    location.postal = feature.properties.postcode
    location.country = feature.properties.country_code

    console.log(location)
});
