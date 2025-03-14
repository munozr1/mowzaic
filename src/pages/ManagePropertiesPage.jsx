import { Trash2, X } from "lucide-react";
import { useAuthentication } from "../AuthenticationContext";
import { useEffect, useState } from "react";
const ManagePropertiesPage = () => {
  const {addresses, token} = useAuthentication();
  const [properties, setProperties] = useState([]);
  useEffect(()=>{
    console.log("addresses: ", addresses);
    setProperties(addresses);
  },[addresses]);


  const handleRemoveProperty = async (propertyId) => {
    try {
      const response = await fetch(`http://localhost:3000/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to remove property');
      }
      
      setProperties(properties.filter((property) => property.id !== propertyId));
    } catch (error) {
      console.error('Error removing property:', error);
    }
  };

  const handleCancelSubscription = () => {
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
                    {property.address}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {property.city}, {property.state} {property.zipCode}
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
                      {"weekly"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      "bg-green-100 text-green-800" 
                    }`}>
                      {"active"}
                    </span>
                  </div>
                </div>
                
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Next billing: {new Date().toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleCancelSubscription(property.id)}
                    className="inline-flex items-center text-sm text-red-500 hover:text-red-700"
                  >
                    <X size={16} className="mr-1" />
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePropertiesPage;
