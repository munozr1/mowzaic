import { Trash2, X } from "lucide-react";
import { useAuthentication } from "../AuthenticationContext";
import { useEffect, useState } from "react";
import { useNavigation } from "../NavigationContext";

const ManagePropertiesPage = () => {
  const {supabase, user} = useAuthentication();
  const [properties, setProperties] = useState([]);
  const {navigate} = useNavigation();
  
  useEffect(()=>{
    const fetchProperties = async () => {
      if (!user) {
        console.warn('No user logged in');
        return;
      }

      // Fetch properties through the user_properties junction table
      // user.id is now directly the uuid in users table
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('No properties found for this user.');
        setProperties([]);
      } else {
        // Flatten the structure to get just the properties
        const propertyList = data.map(item => ({
          ...item.properties,
          property_id: item.properties.id
        }));
        console.log('Fetched properties:', propertyList);
        setProperties(propertyList);
      }
    }
    fetchProperties();
  }, [user, supabase]);


  const handleRemoveProperty = async (propertyId) => {
    try {
      // Soft delete by setting deleted_at timestamp in user_properties
      // user.id is now directly the uuid in users table
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
          <button 
          onClick={() => navigate('/book')}
          className="mt-4 bg-[#2EB966] text-white px-4 py-2 rounded-md hover:bg-[#25A057] transition">
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => (
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
                  className="text-red-500 hover:cursor-pointer  hover:text-red-700 p-1"
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
                      Next service: {new Date().toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleCancelSubscription(property.property_id)}
                    className="inline-flex items-center hover:cursor-pointer text-sm text-red-500 hover:text-red-700"
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
