import { useState } from "react";
import { Search, MapPin, Clock } from "lucide-react";
import { motion } from "motion/react";
import AddressAutofillBar from "../components/AddressAutofillBar";

const LandingPage = () => {
  const [address, setAddress] = useState("");
  const handleSubmit = () => {
    // Handle address submission here - typically would redirect to main app
    console.log("Address submitted:", address);
  };

  return (
	  <>
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold text-[#2EB966]">mowzaic</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-gray-800 hover:text-[#2EB966] text-sm font-medium">
              log in
            </a>
            <a
              href="/signup"
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800"
            >
              sign up
            </a>
          </div>
        </div>
      </div>
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
              
              <div className="md:w-auto bg-white rounded-md flex items-center overflow-hidden">
                <select className="px-4 py-4 focus:outline-none appearance-none pr-8 text-gray-700 bg-transparent">
                  <option>this week</option>
                  <option>next week</option>
                </select>
                <div className="px-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <button
                type="button"
                className="md:w-auto bg-[#2EB966] hover:bg-[#2EB966]/90 text-white font-bold py-4 px-8 rounded-md flex items-center justify-center"
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
