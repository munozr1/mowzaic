import { useState } from 'react';
import { useNavigation } from '../NavigationContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const { navigate } = useNavigation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is the average cost to have your lawn mowed?",
      answer: "The average cost to have your lawn mowed is $35-$55 depending on size. Larger properties or those with more complex terrain may cost more."
    },
    {
      question: "What's the difference between lawn care and lawn service?",
      answer: "Lawn service typically refers to basic maintenance like mowing, edging, and trimming. Lawn care is more comprehensive and includes fertilization, weed control, aeration, and overall lawn health management. Mowzaic primarily focuses on quality mowing services."
    },
    {
      question: "Should I tip a lawn guy?",
      answer: "Tipping on Mowzaic is not currently supported, but with enough customer demand we can add the feature so customers can express their gratitude. If you'd like to see tipping added, please let us know through our feedback channels!"
    },
    {
      question: "How do I choose a good lawn service?",
      answer: "Look for services with verified reviews, clear pricing, reliable scheduling, and proper insurance. Mowzaic makes this easy by connecting you with pre-vetted lawn care professionals in your area who are committed to quality service."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-[#2EB966] cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity"
          >
            mowzaic
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors cursor-pointer bg-transparent border-none"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* FAQ Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Find answers to common questions about Mowzaic and our lawn care services.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none"
              >
                <h2 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h2>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-[#2EB966]/10 rounded-lg border border-[#2EB966]/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-4">
            Can't find the answer you're looking for? Please reach out to our customer support team.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#2EB966] text-white px-6 py-2 rounded-md hover:bg-[#26a557] transition-colors cursor-pointer border-none font-medium"
          >
            Contact Support
          </button>
        </div>
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
  );
};

export default FAQ;
