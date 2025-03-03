//import { useState } from "react";
import { Search, MapPin, Clock } from "lucide-react";
import { motion } from "motion/react";
import AddressAutofillBar from "../components/AddressAutofillBar";
import { encodeJson } from "../utils";
import { useNavigation } from "../NavigationContext";

const LandingPage = () => {
  const { navigate } =  useNavigation();
  const handleSubmit = (place) => {
    // Handle address submission here - typically would redirect to main app
    const encodedData = encodeJson(place)
    localStorage.setItem('hasVisited', 'true')
    navigate('/book', {gt: encodedData})
  };

  return (
	  <>
    <div className="min-h-screen flex flex-col">
      
      {/* Hero Section */}
      <div 
        className="flex-1 bg-cover bg-center" 
        style={{ 
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="container mx-auto px-4 flex justify-center pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-5xl font-bold text-white mb-6">
	  	{"mow delivered, just like that."}
            </h1>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2">
              <div className="flex-1 bg-white rounded-md flex items-center ">
                <div className="px-4">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
	  	<AddressAutofillBar onSelect={handleSubmit} />
              </div>
              
              <div className="md:w-auto bg-white rounded-md flex items-center justify-center overflow-hidden">
                <select id="booking-week" className="px-4 py-4 focus:outline-none appearance-none pr-8 text-gray-700 bg-transparent">
                  <option>this week</option>
                  <option>next week</option>
                </select>
                <div className="pr-5">
                  <Clock className="h-5  w-5 text-gray-400" />
                </div>
              </div>
              
              <button
                type="button"
                className="md:w-auto bg-[#2EB966] hover:bg-[#2EB966]/90 text-white font-bold py-4 px-8 rounded-md flex items-center justify-center"
	  	          onClick={handleSubmit}
              >
                <Search className="h-5 w-5 mr-2" />
              </button>
            </div>
            
            <div className="mt-4">
              <a href="/" className="text-white hover:underline text-sm">
                or sign in to book service
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </>
  );
};
export default LandingPage;
