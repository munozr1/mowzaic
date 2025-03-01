import PropTypes from 'prop-types'
import {useState, useRef} from "react"
import {ChevronLeft, ChevronRight} from "lucide-react"
import {motion} from "motion/react"


function formatDayNumber(day){
	const num = day.getDate()
	return num < 10 ? `0${num}` : num;
}
function formatDayName(day){
	return day.toLocaleDateString('en-us', {weekday: 'short'})
}

function addDays(today, days) {
	const newDate = new Date(today); 
	newDate.setDate(newDate.getDate() + days);
	return newDate;
}

function HorizontalScrollDatePicker(props) {
	const [chosenDate, setChosenDate] = useState();
	const [startDate, setStartDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(null);
	const scrollContainerRef = useRef(null);
	const handleDateSelect = (date) => {
	    setSelectedDate(date);
	    setChosenDate(date);
	};

	const handlePrevWeek = () => {
	    const newStart = addDays(startDate, -7);
	    setStartDate(newStart);
	};

	const handleNextWeek = () => {
	    const newStart = addDays(startDate, 7);
	    setStartDate(newStart);
	};

	const weekDays = Array.from({length: 7}, (_, i) => addDays(startDate, i));

	return (
		<>
		<div className="space-y-2">
            <div className="relative">
              <button 
                type="button"
                onClick={handlePrevWeek}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2EB966]"
                aria-label="Previous week"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              <div 
                ref={scrollContainerRef}
                className="flex space-x-4 overflow-x-auto py-4 px-8 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {weekDays.map((date) => {
                  const isSelected = selectedDate && date == selectedDate
                  const dayNumber = formatDayNumber(date);
                  const dayName = formatDayName(date);
                  
                  return (
                    <motion.div
                      key={date.toISOString()}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: isSelected ? 1.1 : 1,
                        borderColor: isSelected ? '#2EB966' : '#e5e7eb' 
                      }}
                      onClick={() => handleDateSelect(date)}
                      className={`flex flex-col items-center min-w-[60px] h-[80px] border-2 rounded-lg shadow-sm 
                        ${isSelected ? 'border-[#2EB966] bg-[#2EB966]/10' : 'border-gray-200 bg-white'} 
                        cursor-pointer transition-all duration-200 hover:border-[#2EB966]/50`}
                    >
                      <div className="flex flex-col items-center justify-between h-full py-2">
                        <span className="text-xl font-bold">{dayNumber}</span>
                        <span className="text-xs text-gray-500">{dayName}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              <button 
                type="button"
                onClick={handleNextWeek}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2EB966]"
                aria-label="Next week"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
            
            {/*errors.deliveryDate && (
              <p className="text-red-500 text-sm">Please select a delivery date</p>
            )*/}
          </div>
		</>

	)
}
HorizontalScrollDatePicker.propTypes = {
	day: PropTypes.instanceOf(Date).isRequired,
	idx: PropTypes.number.isRequired,
	selected: PropTypes.number.isRequired,
	onSelect: PropTypes.func.isRequired,
};



export default HorizontalScrollDatePicker
