import { Trash2, X, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { useAuthentication } from "../AuthenticationContext";
import { useEffect, useState } from "react";
import { useNavigation } from "../NavigationContext";
import { BACKEND_URL } from "../constants";

const ManagePropertiesPage = () => {
  const {supabase, user, token} = useAuthentication();
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const {navigate} = useNavigation();
  
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user || !token) {
        console.warn('No user logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch properties through the user_properties junction table
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('user_properties')
          .select(`
            property_id,
            properties (
              id,
              address,
              city,
              state,
              postal,
              coordinates,
              codes,
              has_pets
            )
          `)
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (propertiesError) {
          console.error('Error fetching properties:', propertiesError);
          setLoading(false);
          return;
        }
        
        const propertyList = propertiesData?.length > 0
          ? propertiesData.map(item => ({
              ...item.properties,
              property_id: item.properties.id
            }))
          : [];
        
        setProperties(propertyList);

        // Fetch subscriptions from backend
        const subscriptionsResponse = await fetch(`${BACKEND_URL}/subscriptions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (subscriptionsResponse.ok) {
          const subscriptionsResult = await subscriptionsResponse.json();
          setSubscriptions(subscriptionsResult.subscriptions || []);
        } else {
          console.error('Error fetching subscriptions:', await subscriptionsResponse.text());
          setSubscriptions([]);
        }

        // Fetch estimates for all properties - only show released estimates
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('estimates')
          .select('*')
          .in('property_id', propertyList.map(p => p.property_id))
          .eq('released', true);

        if (estimatesError) {
          console.error('Error fetching estimates:', estimatesError);
          setEstimates([]);
        } else {
          setEstimates(estimatesData || []);
        }

        // Fetch bookings for all properties to check service completion
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('property_id', propertyList.map(p => p.property_id))
          .order('date_of_service', { ascending: false });

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          setBookings([]);
        } else {
          setBookings(bookingsData || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user, token, supabase]);


  const handleRemoveProperty = async (propertyId) => {
    try {
      // Soft delete by setting deleted_at timestamp in user_properties
      const { error } = await supabase
        .from('user_properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('property_id', propertyId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing property:', error);
        throw new Error('Failed to remove property');
      }
      
      setProperties(properties.filter((property) => property.property_id !== propertyId));
    } catch (error) {
      console.error('Error removing property:', error);
      alert('Failed to remove property. Please try again.');
    }
  };

  const handleAcceptEstimate = async (estimateId) => {
    try {
      setActionLoading(`accept-${estimateId}`);
      const response = await fetch(`${BACKEND_URL}/estimates/${estimateId}/accept`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to accept estimate');
      }

      // Update local state
      setEstimates(estimates.map(est => 
        est.id === estimateId ? { ...est, accepted: 'accepted' } : est
      ));

      // TODO: Send notification to customer via email/SMS that estimate was accepted
      // Backend should trigger this notification when estimate is accepted
      
      alert('Estimate accepted! You can now subscribe to recurring service.');
    } catch (error) {
      console.error('Error accepting estimate:', error);
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectEstimate = async (estimateId) => {
    try {
      setActionLoading(`reject-${estimateId}`);
      const response = await fetch(`${BACKEND_URL}/estimates/${estimateId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reject estimate');
      }

      // Update local state
      setEstimates(estimates.map(est => 
        est.id === estimateId ? { ...est, accepted: 'rejected' } : est
      ));

      // TODO: Send notification to provider via email/SMS that estimate was rejected
      // Consider adding a feedback form for why customer rejected the estimate
      
      alert('Estimate rejected.');
    } catch (error) {
      console.error('Error rejecting estimate:', error);
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubscription = async (estimateId, frequency) => {
    try {
      setActionLoading(`subscribe-${estimateId}`);
      const response = await fetch(`${BACKEND_URL}/stripe/create-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estimateId,
          frequency
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create subscription');
      }

      const result = await response.json();

      // Backend now returns Stripe Checkout URL (same as one-time booking flow)
      // Redirect to Stripe Checkout for subscription payment
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert(error.message);
      setActionLoading(null);
    }
    // Note: Don't clear loading state here since we're redirecting
  };

  const handleCancelSubscription = async (subscriptionId) => {
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    
    const confirmMessage = `Are you sure you want to cancel this subscription?\n\n` +
      `• Frequency: ${subscription?.frequency}\n` +
      `• Price: $${((subscription?.estimates?.price_cents || 0) / 100).toFixed(2)} per service\n` +
      `• All future unpaid bookings will be removed\n` +
      `• Paid bookings will still be completed\n\n` +
      `This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(`cancel-${subscriptionId}`);
      const response = await fetch(`${BACKEND_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to cancel subscription');
      }

      const result = await response.json();

      // Update local state
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'canceled', canceled_at: new Date().toISOString() } : sub
      ));

      alert(`Subscription canceled successfully.\n${result.message || ''}`);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFrequency = async (subscriptionId, newFrequency) => {
    try {
      setActionLoading(`frequency-${subscriptionId}`);
      const response = await fetch(`${BACKEND_URL}/subscriptions/${subscriptionId}/update-frequency`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ frequency: newFrequency })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update frequency');
      }

      // Update local state
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? { ...sub, frequency: newFrequency } : sub
      ));

      alert(`Subscription frequency updated to ${newFrequency}.`);
    } catch (error) {
      console.error('Error updating frequency:', error);
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper function to get subscription for a property
  // Note: Returns subscription object regardless of status (pending, active, canceled)
  const getPropertySubscription = (propertyId) => {
    return subscriptions.find(sub => sub.properties?.id === propertyId);
  };

  // Helper function to get pending estimate for a property (released by provider)
  // Only returns estimates that are both released=true AND accepted='pending'
  // This ensures customers only see estimates that providers have explicitly made available
  const getPendingEstimate = (propertyId) => {
    return estimates.find(est => est.property_id === propertyId && est.accepted === 'pending' && est.released === true);
  };

  // Helper function to get accepted estimate for a property
  // Used to show the "Ready to Subscribe" UI section
  const getAcceptedEstimate = (propertyId) => {
    return estimates.find(est => est.property_id === propertyId && est.accepted === 'accepted');
  };

  // Helper function to get first completed booking for a property
  // Used to determine if we should show "waiting for estimate" message
  const getCompletedBooking = (propertyId) => {
    return bookings.find(booking => booking.property_id === propertyId && booking.service_status === 'completed');
  };

  // Helper function to check if property has any pending/scheduled bookings
  // Returns true for bookings that are scheduled OR have pending payment
  // This covers both first-time bookings and subscription bookings in scheduled state
  const hasPendingBooking = (propertyId) => {
    return bookings.some(booking => 
      booking.property_id === propertyId && 
      (booking.service_status === 'scheduled' || booking.payment_status === 'pending')
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-600">Loading properties...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#2EB966] mb-6">My Properties</h1>
      
      {properties.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <p className="text-gray-600">{`You don't have any properties yet.`}</p>
          <button 
          onClick={() => navigate('/book')}
          className="mt-4 bg-[#2EB966] text-white px-4 py-2 rounded-md hover:bg-[#25A057] transition">
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => {
            // Gather all relevant state for this property
            const subscription = getPropertySubscription(property.property_id);
            const pendingEstimate = getPendingEstimate(property.property_id);
            const acceptedEstimate = getAcceptedEstimate(property.property_id);
            const completedBooking = getCompletedBooking(property.property_id);
            const hasPending = hasPendingBooking(property.property_id);
            
            // Important: subscription can exist with status='pending', 'active', or 'canceled'
            // isSubscribed specifically checks for 'active' status only
            // This allows pending subscriptions to show booking status messages
            const isSubscribed = subscription && subscription.status === 'active';
            const isCanceled = subscription && subscription.status === 'canceled';

            return (
            <div key={property.property_id} className="bg-white rounded-md shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {property.address}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {property.city}, {property.state} {property.postal}
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveProperty(property.property_id)}
                  className="text-red-500 hover:cursor-pointer hover:text-red-700 p-1"
                  disabled={isSubscribed}
                  title={isSubscribed ? "Cannot remove property with active subscription" : "Remove property"}
                >
                  <Trash2 size={20} className={isSubscribed ? "opacity-50" : ""} />
                </button>
              </div>

              {/* Pending Estimate Section */}
              {pendingEstimate && !isSubscribed && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Clock className="text-blue-600 mt-1" size={20} />
                        <div>
                          <h3 className="font-semibold text-gray-800">New Price Estimate</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Provider has estimated <span className="font-bold">${(pendingEstimate.price_cents / 100).toFixed(2)}</span> for recurring service
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {/* TODO: Add email/SMS notification when provider creates estimate */}
                            Accept this estimate to enable subscription service
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={() => handleAcceptEstimate(pendingEstimate.id)}
                        disabled={actionLoading === `accept-${pendingEstimate.id}`}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        {actionLoading === `accept-${pendingEstimate.id}` ? 'Accepting...' : 'Accept Estimate'}
                      </button>
                      <button
                        onClick={() => handleRejectEstimate(pendingEstimate.id)}
                        disabled={actionLoading === `reject-${pendingEstimate.id}`}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <XCircle size={16} className="mr-2" />
                        {actionLoading === `reject-${pendingEstimate.id}` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Creation Section (when estimate accepted but not subscribed) */}
              {acceptedEstimate && !isSubscribed && !isCanceled && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="text-green-600 mt-1" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">Ready to Subscribe</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Price: <span className="font-bold">${(acceptedEstimate.price_cents / 100).toFixed(2)}</span> per service
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Choose your service frequency:</p>
                        <div className="mt-3 flex space-x-3">
                          <button
                            onClick={() => handleCreateSubscription(acceptedEstimate.id, 'weekly')}
                            disabled={actionLoading === `subscribe-${acceptedEstimate.id}`}
                            className="px-4 py-2 bg-[#2EB966] text-white rounded-md hover:bg-[#25A057] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {actionLoading === `subscribe-${acceptedEstimate.id}` ? 'Creating...' : 'Weekly Service'}
                          </button>
                          <button
                            onClick={() => handleCreateSubscription(acceptedEstimate.id, 'biweekly')}
                            disabled={actionLoading === `subscribe-${acceptedEstimate.id}`}
                            className="px-4 py-2 bg-[#2EB966] text-white rounded-md hover:bg-[#25A057] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {actionLoading === `subscribe-${acceptedEstimate.id}` ? 'Creating...' : 'Bi-weekly Service'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Subscription Section */}
              {isSubscribed && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">Subscription:</span>
                      <span className="ml-2 text-sm font-medium capitalize">
                        {subscription.frequency}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (${(subscription.estimates?.price_cents / 100).toFixed(2)} per service)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        active
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>
                        Next service: {subscription.next_service_date 
                          ? new Date(subscription.next_service_date).toLocaleDateString()
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {/* Frequency toggle */}
                      <select
                        value={subscription.frequency}
                        onChange={(e) => handleUpdateFrequency(subscription.id, e.target.value)}
                        disabled={actionLoading === `frequency-${subscription.id}`}
                        className="text-sm px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                      </select>
                      
                      <button 
                        onClick={() => handleCancelSubscription(subscription.id)}
                        disabled={actionLoading === `cancel-${subscription.id}`}
                        className="inline-flex items-center hover:cursor-pointer text-sm text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} className="mr-1" />
                        {actionLoading === `cancel-${subscription.id}` ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Canceled Subscription Section */}
              {isCanceled && acceptedEstimate && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">Subscription:</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        canceled
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        Canceled on {new Date(subscription.canceled_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateSubscription(acceptedEstimate.id, subscription.frequency)}
                      disabled={actionLoading === `subscribe-${acceptedEstimate.id}`}
                      className="px-4 py-2 bg-[#2EB966] text-white rounded-md hover:bg-[#25A057] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {actionLoading === `subscribe-${acceptedEstimate.id}` ? 'Resubscribing...' : 'Resubscribe'}
                    </button>
                  </div>
                </div>
              )}

              {/* Booking Status Section - Shows when no active subscription or estimates */}
              {/* Critical: Check !isSubscribed instead of !subscription to allow pending subscriptions */}
              {/* Pending subscriptions (status='pending') should show booking progress, not subscription UI */}
              {!pendingEstimate && !acceptedEstimate && !isSubscribed && !isCanceled && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {!completedBooking && !hasPending && (
                    <>
                      <p className="text-sm text-gray-600">
                        Book your first service to receive a price estimate for recurring service.
                      </p>
                      <button
                        onClick={() => navigate('/book')}
                        className="mt-2 text-sm text-[#2EB966] hover:text-[#25A057] font-medium"
                      >
                        Book First Service →
                      </button>
                    </>
                  )}
                  {/* Show "Service Scheduled" when booking exists but not yet completed */}
                  {hasPending && !completedBooking && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start space-x-3">
                        <Clock className="text-yellow-600 mt-1" size={20} />
                        <div>
                          <h3 className="font-semibold text-gray-800">Service Scheduled</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Your first service is scheduled. After completion, the provider will create a custom estimate for recurring service.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Show "Service Completed" when booking done but estimate not yet released */}
                  {completedBooking && !pendingEstimate && !acceptedEstimate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="text-blue-600 mt-1" size={20} />
                        <div>
                          <h3 className="font-semibold text-gray-800">Service Completed</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Your first service was completed on {new Date(completedBooking.date_of_service).toLocaleDateString()}.
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {/* TODO: Provider will create and release estimate - send email/SMS notification when estimate is ready */}
                            Waiting for provider to create and release your custom pricing estimate for recurring service.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagePropertiesPage;
