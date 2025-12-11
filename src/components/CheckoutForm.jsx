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
    const bookingData = JSON.parse(localStorage.getItem('bookingData'));
    const bookingId = bookingData?.booking?.id || null;
    const propertyId = bookingData?.booking?.property_id || null;
    const createCheckoutSession = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/create-checkout-session`,
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
      {processing && <p>Redirecting to checkout...</p>}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
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
