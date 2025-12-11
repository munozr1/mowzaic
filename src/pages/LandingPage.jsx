import { MapPin} from "lucide-react";
import { motion } from "motion/react";
import AddressAutofillBar from "../components/AddressAutofillBar";
import { useLoginModal } from "../LoginModalContext";
import { encodeJson } from "../utils";
import { useNavigation } from "../NavigationContext";

const LandingPage = () => {
  const { navigate } =  useNavigation();
  const { openLoginModal } = useLoginModal();
  const handleSubmit = (place) => {
    // Handle address submission here - typically would redirect to main app
    const encodedData = encodeJson({selectedAddress: place})
    localStorage.setItem('hasVisited', 'true')
    navigate('/book', {gt: encodedData})
  };

  return (
    <>
      <div className="bg-[#f0fdf4] antialiased min-h-[100vh] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1">
          <div className="container mx-auto px-4 flex justify-center pt-40 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl  "
            >
              <h2 className="text-5xl md:text-7xl font-bold text-[#14532d] text-center mb-6 tracking-tight">
                mow delivered, <br />
                <span className="text-[#22c55e]">just like that</span>
              </h2>

              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2">
                <div className="p-[0.5rem] shadow-lg flex-1 bg-white rounded-md flex items-center ">
                  <div className="px-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <AddressAutofillBar onSelect={handleSubmit} />
                </div>

                {/* <button
                  type="button"
                  className="shadow-lg md:w-auto bg-[#2EB966] hover:bg-[#2EB966]/90 text-white font-bold py-4 px-8 rounded-md flex items-center justify-center"
                  onClick={handleSubmit}
                >
                  <Search className="h-5 w-5 mr-2" />
                </button> */}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => openLoginModal()}
                  className="hover:underline text-sm cursor-pointer bg-transparent border-none"
                >
                  or sign in to book service
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
export default LandingPage;
