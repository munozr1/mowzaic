import PropTypes from 'prop-types';

function AccessCode({index, onDelete, initialLabel = "", initialCode = "", onChange, isSubmitting}) {
  const handleLabelChange = (e) => {
    if (onChange) {
      onChange(index, 'label', e.target.value);
    }
  };

  const handleCodeChange = (e) => {
    if (onChange) {
      onChange(index, 'code', e.target.value);
    }
  };

  return (
    <div key={index} id={`code-container-${index}`} className="mr6 w-full space-x-2">
      {index > 1 && <a onClick={() => onDelete(index)} className="hover:cursor-pointer m-0 text-red-300 hover:text-red-500">remove</a>}
      <div className="flex">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input 
            id={`label-${index}`}
            type="text"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-green-600"
            placeholder="label (e.g., Driveway Gate)"
            value={initialLabel}
            onChange={handleLabelChange}
            disabled={isSubmitting}
          />
          <div className="flex space-x-2">
            <input 
              id={`code-${index}`}
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-green-600"
              placeholder="code (e.g., 1234)"
              value={initialCode}
              onChange={handleCodeChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>	
  );
}

AccessCode.propTypes = {
  index: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  initialLabel: PropTypes.string,
  initialCode: PropTypes.string,
  onChange: PropTypes.func,
  isSubmitting: PropTypes.bool
};

export default AccessCode;

