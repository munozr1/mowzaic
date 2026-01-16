export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: January 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to Mowzaic ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our lawn care services platform, whether as a customer or service provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.1 Information You Provide</h3>
            <p className="text-gray-700 mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, phone number, and password</li>
              <li><strong>Profile Information:</strong> Profile picture, preferences, and settings</li>
              <li><strong>Property Information:</strong> Service addresses, property details, and access codes</li>
              <li><strong>Payment Information:</strong> Payment card details (processed securely through Stripe)</li>
              <li><strong>Booking Information:</strong> Service requests, scheduling preferences, and special instructions</li>
              <li><strong>Communications:</strong> Messages, feedback, and customer support inquiries</li>
              <li><strong>Provider Information:</strong> For service providers, we collect additional information including business details, service areas, availability, and verification documents</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Device Information:</strong> Device type, operating system, browser type, and unique device identifiers</li>
              <li><strong>Usage Information:</strong> Pages viewed, features used, and time spent on our platform</li>
              <li><strong>Location Information:</strong> With your permission, we collect precise location data to match you with nearby service providers and facilitate service delivery</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring website addresses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete bookings and transactions</li>
              <li>Match customers with appropriate service providers</li>
              <li>Send booking confirmations, updates, and service notifications</li>
              <li>Communicate with you about your account or our services</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Send you promotional communications (with your consent)</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Facilitate communication between customers and service providers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-2">We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>With Service Providers:</strong> When you book a service, we share necessary information (name, phone number, property address, service details) with the assigned provider to fulfill your request</li>
              <li><strong>With Customers:</strong> Service providers can view customer contact information and property details for scheduled bookings</li>
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, email delivery, analytics, cloud storage)</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition</li>
              <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
              <li><strong>Safety and Protection:</strong> To protect the rights, property, or safety of Mowzaic, our users, or others</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. We will also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. After account deletion, we may retain certain information in our backup systems for a limited time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-2">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your information in a portable format</li>
              <li><strong>Objection:</strong> Object to processing of your information</li>
              <li><strong>Opt-out:</strong> Opt-out of promotional communications</li>
            </ul>
            <p className="text-gray-700 mt-2">
              To exercise these rights, please contact us at privacy@mowzaic.com. You can also manage many settings directly in your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Third-Party Services</h2>
            <p className="text-gray-700 mb-2">Our platform integrates with third-party services:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
              <li><strong>Google OAuth:</strong> Authentication services (see Google's privacy policy)</li>
              <li><strong>Mapbox:</strong> Address autocomplete and mapping (see Mapbox's privacy policy)</li>
            </ul>
            <p className="text-gray-700 mt-2">
              These services have their own privacy policies governing their collection and use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We reserve the right to modify this Privacy Policy at any time. If we make material changes, we will notify you by email or through a notice on our platform prior to the change becoming effective. Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-3 text-gray-700">
              <p>Mowzaic</p>
              <p>Email: privacy@mowzaic.com</p>
              <p>Website: https://www.mowzaic.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. California Privacy Rights</h2>
            <p className="text-gray-700">
              California residents have additional rights under the California Consumer Privacy Act (CCPA). You have the right to request information about the categories and specific pieces of personal information we have collected, the categories of sources from which we collected information, our business purposes for collecting information, and the categories of third parties with whom we share information. You also have the right to request deletion of your information and to opt-out of the sale of personal information. We do not sell your personal information.
            </p>
          </section>
        </div>
      </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Mowzaic. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="/privacy" className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors">
                Terms of Service
              </a>
              <a href="/faq" className="text-sm text-gray-600 hover:text-[#22c55e] transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
