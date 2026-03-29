import { useEffect, useState } from 'react';
import { useAuthentication } from '../AuthenticationContext';
import { BACKEND_URL } from '../constants';
import { MapPin, User, Clock, CheckCircle, DollarSign, Send, Home } from 'lucide-react';

const ProviderDashboard = () => {
  const { token, user } = useAuthentication();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Track estimate form state per property: { [propertyId]: { price: '', loading: false, error: '' } }
  const [estimateForms, setEstimateForms] = useState({});

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/providers/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to fetch dashboard');
        }

        const data = await response.json();
        setProperties(data.properties || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  const handleEstimateChange = (propertyId, value) => {
    setEstimateForms(prev => ({
      ...prev,
      [propertyId]: { ...prev[propertyId], price: value, error: '' },
    }));
  };

  const handleCreateEstimate = async (propertyId) => {
    const form = estimateForms[propertyId];
    const priceFloat = parseFloat(form?.price);

    if (!form?.price || isNaN(priceFloat) || priceFloat < 1) {
      setEstimateForms(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], error: 'Enter a valid price ($1.00 minimum)' },
      }));
      return;
    }

    const priceCents = Math.round(priceFloat * 100);

    setEstimateForms(prev => ({
      ...prev,
      [propertyId]: { ...prev[propertyId], loading: true, error: '' },
    }));

    try {
      // Create estimate
      const createRes = await fetch(`${BACKEND_URL}/providers/create-estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId, priceCents }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || 'Failed to create estimate');
      }

      const estimate = await createRes.json();

      // Release estimate immediately so customer can see it
      const releaseRes = await fetch(`${BACKEND_URL}/providers/estimates/${estimate.id}/release`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!releaseRes.ok) {
        const errData = await releaseRes.json();
        throw new Error(errData.message || 'Failed to release estimate');
      }

      const releasedEstimate = await releaseRes.json();

      // Update local state
      setProperties(prev =>
        prev.map(p => {
          if (p.property.id === propertyId) {
            return { ...p, estimates: [...p.estimates, releasedEstimate] };
          }
          return p;
        })
      );

      setEstimateForms(prev => ({
        ...prev,
        [propertyId]: { price: '', loading: false, error: '' },
      }));
    } catch (err) {
      setEstimateForms(prev => ({
        ...prev,
        [propertyId]: { ...prev[propertyId], loading: false, error: err.message },
      }));
    }
  };

  // Helper: check if property has an estimate with a price (not the initial NULL one from booking creation)
  const hasRealEstimate = (estimates) => {
    return estimates.some(est => est.price_cents !== null);
  };

  // Helper: get the latest released estimate
  const getLatestEstimate = (estimates) => {
    const released = estimates.filter(est => est.released && est.price_cents !== null);
    if (released.length === 0) return null;
    return released.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">My Properties</h1>

      {properties.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <Home className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-600">No properties assigned yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Properties will appear here once customers book services through your company.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map(({ property, bookings, customer, estimates, isNewClient, hasCompletedService }) => {
            const latestEstimate = getLatestEstimate(estimates);
            const hasEstimate = hasRealEstimate(estimates);
            const form = estimateForms[property.id] || {};

            // Determine status for badge
            const nextScheduled = bookings.find(b => b.service_status === 'scheduled');
            const completedCount = bookings.filter(b => b.service_status === 'completed').length;

            return (
              <div key={property.id} className="bg-white rounded-md shadow-sm p-6">
                {/* Property Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1 shrink-0" size={20} />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {property.address}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        {property.city}, {property.state} {property.postal}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNewClient ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New Client
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Returning
                      </span>
                    )}
                    {property.has_pets && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pets
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                {customer && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} className="text-gray-400" />
                    <span>
                      {customer.first_name && customer.last_name
                        ? `${customer.first_name} ${customer.last_name}`
                        : customer.email}
                    </span>
                    {customer.phone && (
                      <span className="text-gray-400 ml-2">{customer.phone}</span>
                    )}
                  </div>
                )}

                {/* Booking Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>{completedCount} completed</span>
                  </div>
                  {nextScheduled && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock size={16} className="text-blue-500" />
                      <span>
                        Next: {new Date(nextScheduled.date_of_service).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Estimate Section */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {latestEstimate ? (
                    // Show existing estimate
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="text-gray-700">
                          Current estimate: <span className="font-semibold">${(latestEstimate.price_cents / 100).toFixed(2)}</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          latestEstimate.accepted === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : latestEstimate.accepted === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {latestEstimate.accepted}
                        </span>
                      </div>
                    </div>
                  ) : hasCompletedService && !hasEstimate ? (
                    // Show estimate creation form (only after first service is completed)
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-start gap-3">
                        <DollarSign className="text-blue-600 mt-0.5 shrink-0" size={20} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm">Create Estimate</h3>
                          <p className="text-xs text-gray-600 mt-1 mb-3">
                            First service completed. Set the recurring price for this property.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                placeholder="0.00"
                                value={form.price || ''}
                                onChange={(e) => handleEstimateChange(property.id, e.target.value)}
                                className="pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm w-32 focus:outline-none focus:ring-green-500 focus:border-green-500"
                                disabled={form.loading}
                              />
                            </div>
                            <button
                              onClick={() => handleCreateEstimate(property.id)}
                              disabled={form.loading || !form.price}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              <Send size={14} />
                              {form.loading ? 'Sending...' : 'Send Estimate'}
                            </button>
                          </div>
                          {form.error && (
                            <p className="text-xs text-red-600 mt-2">{form.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : !hasCompletedService ? (
                    // First service not completed yet
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={16} className="text-gray-400" />
                      <span>Estimate available after first service is completed</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
