/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { useAuthentication } from "../AuthenticationContext";
import { BACKEND_URL } from "../constants";
// Replace with your Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// eslint-disable-next-line react/prop-types, no-unused-vars
const CheckoutFormContent = ({ onPaymentSuccess }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { token } = useAuthentication();
  const stripe = useStripe();

  useEffect(() => {
    // Wait for Stripe to load before creating checkout session
    if (!stripe || !token) {
      return;
    }

    const bookingData = JSON.parse(localStorage.getItem('bookingData'));
    const bookingId = bookingData?.booking?.id || null;
    const propertyId = bookingData?.booking?.property_id || null;
    
    const createCheckoutSession = async () => {
      try {
        setProcessing(true);
        const response = await fetch(
          `${BACKEND_URL}/stripe/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              bookingId: bookingId || null,
              propertyId: propertyId || null,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }

        const { sessionId } = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    createCheckoutSession();
  }, [token, stripe]);

  return (
    <div className="w-full max-w-md mx-auto">
      {processing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2EB966] mb-4"></div>
          <p className="text-gray-600">Redirecting to secure checkout...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-semibold">Payment Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!stripe && !error && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2EB966] mb-4"></div>
          <p className="text-gray-600">Loading payment system...</p>
        </div>
      )}
    </div>
  );
};

const CheckoutForm = ({ onPaymentSuccess, bookingData }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Elements stripe={stripePromise}>
        <CheckoutFormContent
          onPaymentSuccess={onPaymentSuccess}
          bookingData={bookingData}
        />
      </Elements>
    </div>
  );
};

export default CheckoutForm;
