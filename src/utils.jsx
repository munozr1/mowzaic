
export function encodeJson(jsonObj) {
  const jsonString = JSON.stringify(jsonObj);
  // Encode to Base64
  const base64String = btoa(jsonString);
  // Make URL-safe by replacing characters
  return encodeURIComponent(base64String);
}

export function decodeJson(encodedString) {
  // Replace URL-safe characters back to Base64 characters
  const base64String = decodeURIComponent(encodedString);
  // Decode from Base64
  return JSON.parse(atob(base64String));
}


export function getParam(param){
	const queryString = window.location.search;
	const params = new URLSearchParams(queryString);
	return params.get(param)
}

export function fullAddress(address) {
  return `${address.address}, ${address.city}, ${address.state} ${address.zip}`;
}

export function findAddress(addresses, address) {
  //return -1 if not found, else return address.propertyId
  const index = addresses.findIndex(a => fullAddress(a) === fullAddress(address));
  return index === -1 ? -1 : addresses[index].propertyId || -1;
}
