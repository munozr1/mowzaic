import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import AddressAutofillBar from "../components/AddressAutofillBar";
import { useLoginModal } from "../LoginModalContext";
import { encodeJson } from "../utils";
import { useNavigation } from "../NavigationContext";
import { SERVICE_AREAS, TARGET_CITIES, TARGET_STATE, TARGET_STATE_CODE } from "../constants/serviceAreas";
import { toast, Toaster } from "sonner";

const LandingPage = () => {
  const { navigate } = useNavigation();
  const { openLoginModal } = useLoginModal();

  const trackDemand = async (status, place) => {
    try {
      await fetch('/api/track-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          address: place.address,
          city: place.city,
          state: place.state,
          postal: place.postal,
          phone: null
        })
      });
    } catch (err) {
      console.error("Failed to track demand", err);
    }
  };

  const handleSubmit = async (place) => {
    // AddressAutofillBar returns a simplified object with these properties
    const stateName = place.state;
    const city = place.city;
    const postal = place.postal;

    // 1. State Check (Robustness: Case insensitive)
    const normalizedStateName = stateName?.trim().toLowerCase();
    const normalizedTargetState = TARGET_STATE.toLowerCase();
    const normalizedTargetCode = TARGET_STATE_CODE.toLowerCase();

    if (normalizedStateName !== normalizedTargetState && normalizedStateName !== normalizedTargetCode) {
      toast.info("We waitlisted you! We currently only service Texas residents.");
      await trackDemand("rejected_out_of_state", place);
      return;
    }

    // 2. County Check
    // This check validates if the postal code is in our list of Dallas County postal codes.
    const isPostalInServiceArea = SERVICE_AREAS.some(area => area.postalCodes.includes(postal));

    if (!isPostalInServiceArea) {
      toast.info("We waitlisted you! We currently only service Dallas County residents.");
      await trackDemand("rejected_out_of_county", place);
      return;
    }

    // 3. City Check - REMOVED
    // We now allow all Dallas County residents to proceed to the booking page
    // so we can capture their phone number before waitlisting them if they are not in target cities.

    // 4. Success (Proceed to booking)
    // We track this as 'proceed_to_book' to differentiate from 'accepted_no_book' if we want,
    // or keep 'accepted_no_book' as "passed landing page validation".
    // Let's use 'proceed_to_book' for clarity in logs, or just 'accepted_no_book' to mean "allowed to book".
    // Given the requirement "allow user to continue", this is effectively an acceptance at this stage.
    await trackDemand("accepted_no_book", place);

    const encodedData = encodeJson({ selectedAddress: place })
    localStorage.setItem('hasVisited', 'true')
    navigate('/book', { gt: encodedData })
  };

  return (
    <>
      <Toaster duration={10000} position="top-center" />
      <div className="bg-[#f0fdf4] antialiased min-h-[100vh] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1">
          <div className="container mx-auto px-4 flex justify-center pt-40 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-xl w-full"
            >
              <h2 className="text-5xl md:text-7xl font-bold text-[#14532d] text-center mb-6 tracking-tight">
                mow delivered, <br />
                <span className="text-[#22c55e]">just like that</span>
              </h2>

              <div className="flex flex-col space-y-4">
                <div className="p-[0.5rem] shadow-lg flex-1 bg-white rounded-md flex items-center ">
                  <div className="px-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <AddressAutofillBar onSelect={handleSubmit} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => openLoginModal()}
                  className="hover:underline text-sm cursor-pointer bg-transparent border-none text-[#14532d]"
                >
                  or sign in to book service
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-600">
                © {new Date().getFullYear()} Mowzaic. All rights reserved.
              </div>
              <div className="flex space-x-6">
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors cursor-pointer bg-transparent border-none"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors cursor-pointer bg-transparent border-none"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => navigate('/faq')}
                  className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors cursor-pointer bg-transparent border-none"
                >
                  FAQ
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
export default LandingPage;
