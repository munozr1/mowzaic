import { MapboxAddressAutofill } from '@mapbox/search-js-web'

const autofillElement = new MapboxAddressAutofill()

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
autofillElement.accessToken = mapboxToken

autofillElement.options = {
  country: 'us'
}


const address_input = document.getElementById("input-address")

const address_form = address_input.parentElement


autofillElement.appendChild(address_input)
address_form.appendChild(autofillElement)
