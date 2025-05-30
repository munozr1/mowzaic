import PropTypes from 'prop-types';

function formatDay(day){
	const num = day.getDate()
	return num < 10 ? `0${num}` : num;
}

function DayCard(props) {
	const data = {id: props.idx, bookingDate: props.day}

	return (
		<div className="min-w-[4.5rem] flex items-center justify-center py-4">
			<div 
				id={`day-${props.idx}`}
				onClick={() => {props.onSelect(data)}}
				className={`hover:cursor-pointer relative ${
					props.selected.id === props.idx 
						? 'scale-125 shadow-lg z-10 bg-white' 
						: 'scale-100'
				} transition-all duration-200 p-2 w-[3.5rem] h-[4rem] flex flex-col items-center rounded-md`}
			>
				<div className="text-2xl font-mono self-center">
					{formatDay(props.day)}
				</div>
				<div className="font-mono self-center">
					{props.day.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}
				</div>
			</div>
		</div>
	)
}

DayCard.propTypes = {
	day: PropTypes.instanceOf(Date).isRequired,
	idx: PropTypes.number.isRequired,
	selected: PropTypes.object.isRequired,
	onSelect: PropTypes.func.isRequired,
};

export default DayCard; 
