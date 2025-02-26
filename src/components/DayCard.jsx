import PropTypes from 'prop-types';


function formatDay(day){
	const num = day.getDate()
	return num < 10 ? `0${num}` : num;
}
function DayCard(props) {

	return (
		<>
		<div 
		id={`day-${props.idx}`}
		onClick={() => {console.log("clicked ", props.day);props.onSelect(props.idx)}}
		className={`snap-center hover:cursor-pointer ${props.selected === props.idx ? 'scale-150' : 'scale-100'} transition-transform duration-200 border m-0 border-green-500 p-2 m-2 bg-green-200 w[3.5rem] h-[4rem] flex flex-col items-center rounded-md`}>
		<div className="text-2xl font-mono self-center">
		{formatDay(props.day)}
		</div>
		<div className=" font-mono self-center">
		{props.day.toLocaleDateString('en-US', { weekday: 'short' })}
		</div>
		</div>
		</>

	)
}
DayCard.propTypes = {
	day: PropTypes.instanceOf(Date).isRequired,
	idx: PropTypes.number.isRequired,
	selected: PropTypes.number.isRequired,
	onSelect: PropTypes.func.isRequired,
};



export default DayCard 
