// src/components/OtherHotels.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiPhone, FiMapPin, FiMail, FiStar, FiExternalLink } from "react-icons/fi";

interface Hotel {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  rating: number;
  category: string;
  distance: string;
  partners: boolean;
}

const OtherHotels: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPartners, setFilterPartners] = useState(false);
  
  const hotelData: Hotel[] = [
    {
      id: "H001",
      name: "Hotel Rajasthan Palace",
      address: "123 Main Street, City Center, Jaipur",
      contact: "+91 98765 43210",
      email: "info@rajasthanpalace.com",
      rating: 4.5,
      category: "luxury",
      distance: "1.2 km",
      partners: true
    },
    {
      id: "H002",
      name: "Green View Resort",
      address: "45 Garden Road, Hill Area, Shimla",
      contact: "+91 87654 32109",
      email: "reservations@greenview.com",
      rating: 4.2,
      category: "resort",
      distance: "3.5 km",
      partners: true
    },
    {
      id: "H003",
      name: "City Comfort Inn",
      address: "78 Business District, Downtown, Mumbai",
      contact: "+91 76543 21098",
      email: "bookings@citycomfort.com",
      rating: 3.8,
      category: "budget",
      distance: "0.8 km",
      partners: false
    },
    {
      id: "H004",
      name: "Seashore Retreat",
      address: "12 Beach Road, Coastal Area, Goa",
      contact: "+91 65432 10987",
      email: "stay@seashore.com",
      rating: 4.7,
      category: "luxury",
      distance: "5.2 km",
      partners: true
    },
    {
      id: "H005",
      name: "Heritage Grand",
      address: "34 Historic Lane, Old Town, Udaipur",
      contact: "+91 54321 09876",
      email: "reception@heritagegrand.com",
      rating: 4.9,
      category: "heritage",
      distance: "2.7 km",
      partners: false
    },
    {
      id: "H006",
      name: "Mountain View Lodge",
      address: "56 Hill Station Road, Mountain View, Manali",
      contact: "+91 43210 98765",
      email: "info@mountainview.com",
      rating: 4.3,
      category: "resort",
      distance: "7.1 km",
      partners: true
    },
    {
      id: "H007",
      name: "Budget Stay Inn",
      address: "89 Economy Street, New Area, Delhi",
      contact: "+91 32109 87654",
      email: "enquiry@budgetstay.com",
      rating: 3.5,
      category: "budget",
      distance: "1.5 km",
      partners: false
    },
    {
      id: "H008",
      name: "Royal Heritage Hotel",
      address: "67 Palace Road, Royal Area, Jodhpur",
      contact: "+91 21098 76543",
      email: "bookings@royalheritage.com",
      rating: 4.8,
      category: "heritage",
      distance: "4.3 km",
      partners: true
    }
  ];

  // Filter hotels based on search term, category, and partners
  const filteredHotels = hotelData.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         hotel.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || hotel.category === filterCategory;
    const matchesPartners = !filterPartners || hotel.partners;
    
    return matchesSearch && matchesCategory && matchesPartners;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };

  const handlePartnersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterPartners(e.target.checked);
  };

  // Function to render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FiStar key={`full-${i}`} className="text-yellow-500 fill-current" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="relative">
          <FiStar className="text-gray-300" />
          <span className="absolute top-0 left-0 overflow-hidden w-1/2">
            <FiStar className="text-yellow-500 fill-current" />
          </span>
        </span>
      );
    }
    
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FiStar key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return (
      <div className="flex">
        {stars}
        <span className="ml-1 text-sm text-[var(--text-secondary)]">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Other Hotels Directory</h1>
      
      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[var(--card-bg)] p-6 rounded-xl shadow-lg mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-[var(--text-secondary)]" />
            </div>
            <input
              type="text"
              placeholder="Search by hotel name or location"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 w-full border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={handleCategoryChange}
              className="px-4 py-2 w-full border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="luxury">Luxury</option>
              <option value="resort">Resort</option>
              <option value="budget">Budget</option>
              <option value="heritage">Heritage</option>
            </select>
          </div>
          
          {/* Partners Only Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="partnersOnly"
              checked={filterPartners}
              onChange={handlePartnersChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[var(--border-color)] rounded bg-[var(--input-bg)]"
            />
            <label htmlFor="partnersOnly" className="ml-2 block text-[var(--text-primary)]">
              Show Partner Hotels Only
            </label>
          </div>
        </div>
      </motion.div>
      
      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHotels.map((hotel, index) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-[var(--card-bg)] rounded-xl shadow-lg overflow-hidden"
          >
            {/* Hotel Card Header */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{hotel.name}</h3>
                {hotel.partners && (
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    Partner
                  </span>
                )}
              </div>
              <div className="mt-1">{renderStars(hotel.rating)}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                Category: {hotel.category.charAt(0).toUpperCase() + hotel.category.slice(1)}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                Distance from HOSS: {hotel.distance}
              </div>
            </div>
            
            {/* Hotel Card Body */}
            <div className="p-4">
              <div className="flex items-start mb-2">
                <FiMapPin className="text-[var(--text-secondary)] mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-primary)]">{hotel.address}</p>
              </div>
              
              <div className="flex items-center mb-2">
                <FiPhone className="text-[var(--text-secondary)] mr-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-primary)]">{hotel.contact}</p>
              </div>
              
              <div className="flex items-center">
                <FiMail className="text-[var(--text-secondary)] mr-2 flex-shrink-0" />
                <p className="text-sm text-[var(--text-primary)] truncate">{hotel.email}</p>
              </div>
            </div>
            
            {/* Hotel Card Footer */}
            <div className="p-4 border-t border-[var(--border-color)]">
              <button className="w-full py-2 px-4 bg-[var(--button-secondary-bg)] hover:bg-[var(--button-secondary-hover-bg)] text-[var(--button-secondary-text)] font-medium rounded-lg transition-colors duration-300 flex items-center justify-center">
                <FiExternalLink className="mr-2" /> View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* No Results Message */}
      {filteredHotels.length === 0 && (
        <div className="bg-[var(--card-bg)] p-8 rounded-xl shadow-lg text-center">
          <p className="text-lg text-[var(--text-secondary)]">No hotels found matching your criteria.</p>
          <button 
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
              setFilterPartners(false);
            }}
            className="mt-4 py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg transition-all duration-300"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default OtherHotels;