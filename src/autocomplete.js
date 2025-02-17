import { MapboxAddressAutofill } from '@mapbox/search-js-web'
// instantiate a <mapbox-address-autofill> element using the MapboxAddressAutofill class
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

    // Log all properties of the selected address
    console.log('Full Address:', feature.properties.full_address);
    console.log('Street:', feature.properties.address_line1);
    console.log('City:', feature.properties.address_level2); // City
    console.log('State:', feature.properties.address_level1); // State
    console.log('Postal Code:', feature.properties.postcode); // ZIP code
    console.log('Country:', feature.properties.country); // Country
});
