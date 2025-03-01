import {motion} from 'motion/react';

function ThankYouBooked() {
  return (
    <div className="border-red-500 mt-10 flex items-center justify-center bg[#2EB966]">
      <motion.div 
	initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center p-8 max-w-2xl mx-auto"
      >
        <motion.div
	  initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-block px-4 py-1 mb-6 bg-[#2EB966]/10 backdrop-blur-sm rounded-full"
        >
          <span className="text-[#2EB966] text-sm font-medium">
	   your sevice has successfully been booked!
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-6xl font-bold  text[#2EB966] mb-6"
        >
          Thank You!
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-[#2EB966] "
        >
          <span className="font-bold">- mowzaic</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThankYouBooked;
