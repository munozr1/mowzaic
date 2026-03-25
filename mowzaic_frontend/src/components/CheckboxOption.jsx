import PropTypes from 'prop-types';

function CheckboxOption({name, id, onChange}) {

	return (
		<>
                <div aria-hidden="true" className="text-sm/6 font-semibold text-gray-900">
		{id == 0 ? 'Options' : ''}
                </div>
		<div className="mt-4 sm:col-span-2 sm:mt-0">
                  <div className="max-w-lg space-y-6">
                    <div className="flex gap-3">
                      <div className="flex h-6 shrink-0 items-center">
                        <div className="group grid size-4 grid-cols-1">
                          <input
                            id="callOnArrival"
                            name="callOnArrival"
                            type="checkbox"
                            aria-describedby="comments-description"
                            className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border--600 checked:bg-green-600 indeterminate:border-green-600 indeterminate:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
			    onChange={onChange}
                          />
                          <svg
                            fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                          >
                            <path
                              d="M3 8L6 11L11 3.5"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-[:checked]:opacity-100"
                            />
                            <path
                              d="M3 7H11"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-[:indeterminate]:opacity-100"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-sm/6">
                        <label htmlFor="comments" className="font-medium text-gray-900">
			{name}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
		</>
	)
}

CheckboxOption.propTypes = {
	name: PropTypes.string.isRequired,
	id: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,

};


export default CheckboxOption;

