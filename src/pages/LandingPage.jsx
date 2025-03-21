//import { useState } from "react";
import { Search, MapPin, Clock } from "lucide-react";
import { motion } from "motion/react";
import AddressAutofillBar from "../components/AddressAutofillBar";
import { encodeJson } from "../utils";
import { useNavigation } from "../NavigationContext";
import PromotionCard from "../components/PromotionCard";
const LandingPage = () => {
  const { navigate } =  useNavigation();
  const handleSubmit = (place) => {
    // Handle address submission here - typically would redirect to main app
    const encodedData = encodeJson({selectedAddress: place})
    localStorage.setItem('hasVisited', 'true')
    navigate('/book', {gt: encodedData})
  };

  return (
    <>
      <div className="bg-[url('../lawnbg.jpg')] bg-cover  min-h-[100vh] flex flex-col">
        {/* Hero Section */}
        <div
          className="flex-1 bg-cover bg-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="container mx-auto px-4 flex justify-center pt-40 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl  "
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
                  <select
                    id="booking-week"
                    className="px-4 py-4 focus:outline-none appearance-none pr-8 text-gray-700 bg-transparent"
                  >
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
                <a href="/login" className="text-white hover:underline text-sm">
                  or sign in to book service
                </a>
              </div>
              <div className="shadow-md mt-6 flex justify-center">
              <PromotionCard />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="rounded-full bg-[#2EB966]/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#2EB966]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s-8-4.5-8-11.8a8 8 0 0 1 16 0c0 7.3-8 11.8-8 11.8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Local Professionals</h3>
              <p className="text-gray-600">
                Experienced lawn care professionals in your neighborhood
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-[#2EB966]/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#2EB966]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">
                {`Book service when it's convenient for you`}
              </p>
            </div>

            <div className="text-center">
              <div className="rounded-full bg-[#2EB966]/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-[#2EB966]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                {`100% satisfaction or we'll make it right`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default LandingPage;
