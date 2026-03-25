import PropTypes, { number } from 'prop-types';

function ScheduleResultsItem({booked, selectedSlot, onSelect, date}) {
	const slots_available = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];



	return (
		<>
		<div className="flex flex-col">
		<li className="border-gray-400 border-b p-2   justify-between items-center flex lg:m-2 mt-5" >
		<div className="border-red-500 borde ">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
		<div className="h-[4.2rem] w-[20rem] flexcol flex flex-wrap borde border-green-500  mb-2">
		{slots_available.map((time, index) => {
			const isSelected = selectedSlot.date === date && selectedSlot.time === time;
			const data = {
				date: date,
				time: time
			}
			const meridian = time >= 12 ? 'pm' : 'am';
			return !booked.includes(time) ? (<div 
				key={index} 
				className={`${booked.includes(time) ? 'pointer-events-none bg-gray-300':null } text-center shadow m-1 rounded-md w-[3.3rem] p-1 hover:cursor-pointer ${ isSelected ? 'bg-black text-white' : 'bg-white text-black'}`}
				onClick={() => !booked.includes(time) && onSelect(data)}
				>
				{time > 12 ? time-12 : time} {meridian}
				</div>
			) : (<></>)
		})}
		</div>
		</li>
		<button className={` self-center w-[10rem] mt-2 hover:cursor-pointer ${selectedSlot.date === date ? '':'hidden'} bg-black text-white text-bold rounded-sm`}> Book now</button>
		</div>
		</>
	)
}

ScheduleResultsItem.propTypes = {
    booked: PropTypes.arrayOf(PropTypes.number).isRequired,
    selectedSlot: PropTypes.shape({
        date: PropTypes.string,
        time: PropTypes.string,
    }),
    onSelect: PropTypes.func.isRequired,
    date: PropTypes.instanceOf(Date).isRequired,
};


export default ScheduleResultsItem;

