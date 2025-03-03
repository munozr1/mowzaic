import  { useState } from "react";
import { Trash2, X } from "lucide-react";

const ManagePropertiesPage = () => {
  const [properties, setProperties] = useState([
    {
      id: "prop-1",
      address: {
        street: "123 Green Meadow Lane",
        city: "Springfield",
        state: "IL",
        zipCode: "62704",
      },
      subscription: {
        type: "Weekly Service",
        status: "Active",
        nextBilling: "May 15, 2023",
      },
    },
    {
      id: "prop-2",
      address: {
        street: "456 Oak Tree Drive",
        city: "Riverdale",
        state: "NY",
        zipCode: "10471",
      },
      subscription: {
        type: "Bi-Weekly Service",
        status: "Active",
        nextBilling: "May 22, 2023",
      },
    },
  ]);

  const handleRemoveProperty = (id ) => {
    setProperties(properties.filter(property => property.id !== id));
    alert({
      title: "Property Removed",
      description: "This property has been removed from your account.",
    });
  };

  const handleCancelSubscription = (id ) => {
    setProperties(properties.map(property => 
      property.id === id 
        ? {
            ...property,
            subscription: {
              ...property.subscription,
              status: "Canceled",
            },
          }
        : property
    ));
    alert({
      title: "Subscription Canceled",
      description: "Your subscription has been canceled for this property.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#2EB966] mb-6">My Properties</h1>
      
      {properties.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <p className="text-gray-600">{`You don't have any properties yet.`}</p>
          <button className="mt-4 bg-[#2EB966] text-white px-4 py-2 rounded-md hover:bg-[#25A057] transition">
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-md shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {property.address.street}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {property.address.city}, {property.address.state} {property.address.zipCode}
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveProperty(property.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Subscription:</span>
                    <span className="ml-2 text-sm font-medium">
                      {property.subscription.type}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.subscription.status === "Active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {property.subscription.status}
                    </span>
                  </div>
                </div>
                
                {property.subscription.status === "Active" && (
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Next billing: {property.subscription.nextBilling}
                    </span>
                    <button 
                      onClick={() => handleCancelSubscription(property.id)}
                      className="inline-flex items-center text-sm text-red-500 hover:text-red-700"
                    >
                      <X size={16} className="mr-1" />
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePropertiesPage;
