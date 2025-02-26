import PropTypes from 'prop-types';

function AccessCode({id, onDelete}) {
	const maxAccessCodeLength = 20;

	return (
		<div key={id} className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-2">
		  <label 
		>
		{id === 1 ? 'Access Codes': ''} 
		</label>
		  <div className="flex mt-2  sm:col-span-1 sm:mt-0">
			  <div>
			    <span 
				className={`${id != 1 ? 'hover:cursor-pointer text-red-300':''}`}
				onClick={() => id != 1 ? onDelete(id) : null}>
				{id === 1 ? 'lable: ' : 'remove'}
			     </span>
			    <input
				id = {`label-${id}`}
			      placeholder="Ex: driveway gate"
			      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-green-600 sm:max-w-2xl sm:text-sm/6"
			      maxLength={maxAccessCodeLength}
			    />
			  </div>
		  </div>
		  <div className="sm:col-span-1">
		    <span className="text-gray-500 text-sm">Code:</span>
		    <input
			id = {`code-${id}`}
		      placeholder="1234"
		      className="block wfull rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-green-600 sm:max-w-2xl sm:text-sm/6"
		    />
		  </div>
		</div>
	)
}

AccessCode.propTypes = {
	id: PropTypes.number.isRequired,
	onDelete: PropTypes.func.isRequired,
};


export default AccessCode;

