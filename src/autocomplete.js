import { MapboxAddressAutofill } from '@mapbox/search-js-web'
// instantiate a <mapbox-address-autofill> element using the MapboxAddressAutofill class
const autofillElement = new MapboxAddressAutofill()


const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
autofillElement.accessToken = mapboxToken


// set the <mapbox-address-autofill> element's options
autofillElement.options = {
    country: 'us',
}

const the_input = document.getElementById('address-input');
const the_form = the_input.parentElement

// append the <input> to <mapbox-address-autofill>
autofillElement.appendChild(the_input);
// append <mapbox-address-autofill> to the <form>
the_form.appendChild(autofillElement);
