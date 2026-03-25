export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: January 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-gray-700">
              By accessing or using Mowzaic (&quot;the Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform. These Terms apply to all users, including customers seeking lawn care services and service providers offering such services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="text-gray-700">
              Mowzaic is a technology platform that connects customers seeking lawn care services with independent service providers. We do not provide lawn care services directly. Instead, we facilitate the connection between customers and providers, process payments, and provide tools to manage bookings. Service providers are independent contractors, not employees of Mowzaic.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <p className="text-gray-700 mb-2">To use the Platform, you must:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Platform under applicable laws</li>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>For service providers: have the necessary licenses, permits, and insurance required in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.1 Account Creation</h3>
            <p className="text-gray-700">
              You must create an account to use certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.2 Account Types</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Customer Accounts:</strong> For users requesting lawn care services</li>
              <li><strong>Provider Accounts:</strong> For independent contractors offering lawn care services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.3 Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. For Customers</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.1 Booking Services</h3>
            <p className="text-gray-700">
              When you book a service, you are entering into a direct agreement with the service provider. Mowzaic facilitates this connection but is not a party to the service agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.2 Payment</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>You agree to pay all fees for services you book</li>
              <li>Payments are processed through Stripe, a third-party payment processor</li>
              <li>All fees are due at the time of booking unless otherwise specified</li>
              <li>Prices are subject to change, but changes will not affect bookings already made</li>
              <li>You authorize us to charge your payment method for all services booked</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.3 Cancellations and Refunds</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Cancellations made more than 24 hours before the scheduled service may receive a full refund</li>
              <li>Cancellations made less than 24 hours before the scheduled service may incur a cancellation fee</li>
              <li>Refunds are processed at our discretion and may take 5-10 business days</li>
              <li>Weather-related cancellations initiated by the provider will result in a full refund</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.4 Property Access</h3>
            <p className="text-gray-700">
              You are responsible for providing accurate property information and access instructions. If a provider cannot access your property due to inaccurate information, you may still be charged for the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. For Service Providers</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.1 Independent Contractor Status</h3>
            <p className="text-gray-700">
              Service providers are independent contractors, not employees, agents, or partners of Mowzaic. You are responsible for all taxes, insurance, licenses, and permits required to provide your services.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.2 Service Standards</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide services in a professional, safe, and timely manner</li>
              <li>Maintain necessary licenses, insurance, and equipment</li>
              <li>Arrive at scheduled appointments on time</li>
              <li>Communicate professionally with customers</li>
              <li>Complete services as described and agreed upon</li>
              <li>Follow all applicable laws and regulations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.3 Payment Terms</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Mowzaic collects payment from customers on your behalf</li>
              <li>We deduct our service fee from each transaction</li>
              <li>Payments are transferred to you according to our payment schedule</li>
              <li>You are responsible for reporting income and paying all applicable taxes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.4 Service Completion</h3>
            <p className="text-gray-700">
              You must mark services as complete in the Platform after finishing work. Failure to complete scheduled services without proper notification may result in account suspension or termination.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.5 Insurance and Liability</h3>
            <p className="text-gray-700">
              You must maintain adequate liability insurance and workers&apos; compensation insurance as required by law. You are solely responsible for any damage to property or injury to persons arising from your services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Prohibited Conduct</h2>
            <p className="text-gray-700 mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malicious code or harmful content</li>
              <li>Engage in fraudulent activity or misrepresentation</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to circumvent our payment system</li>
              <li>Create multiple accounts to manipulate reviews or ratings</li>
              <li>Use the Platform for any unauthorized commercial purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape, copy, or harvest data from the Platform</li>
              <li>Contact other users outside the Platform to arrange services directly (for the purpose of avoiding fees)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p className="text-gray-700">
              The Platform and its content, features, and functionality are owned by Mowzaic and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Platform without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">9.1 Platform Availability</h3>
            <p className="text-gray-700">
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that the Platform will be uninterrupted, secure, or error-free.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">9.2 Service Provider Responsibility</h3>
            <p className="text-gray-700">
              WE DO NOT EMPLOY SERVICE PROVIDERS AND ARE NOT RESPONSIBLE FOR THEIR ACTIONS, OMISSIONS, OR PERFORMANCE. Service providers are independent contractors. We do not guarantee the quality, safety, or legality of services provided.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">9.3 Background Checks</h3>
            <p className="text-gray-700">
              While we may conduct background checks on service providers, we make no representations or warranties regarding the accuracy or completeness of such checks. You are responsible for your own safety and security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MOWZAIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>Your use or inability to use the Platform</li>
              <li>Any conduct or content of any third party on the Platform</li>
              <li>Unauthorized access to or alteration of your transmissions or data</li>
              <li>Services provided or not provided by service providers</li>
              <li>Any damage to property or injury to persons arising from services</li>
            </ul>
            <p className="text-gray-700 mt-2">
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify, defend, and hold harmless Mowzaic and its officers, directors, employees, and affiliates from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>Your violation of these Terms</li>
              <li>Your use of the Platform</li>
              <li>Your violation of any rights of another party</li>
              <li>For service providers: services you provide through the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">12.1 Informal Resolution</h3>
            <p className="text-gray-700">
              If you have a dispute with us, you agree to first contact us at support@mowzaic.com to attempt to resolve the dispute informally.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">12.2 Arbitration</h3>
            <p className="text-gray-700">
              Any dispute arising from these Terms or the Platform that cannot be resolved informally shall be resolved through binding arbitration in accordance with the American Arbitration Association&apos;s Commercial Arbitration Rules. You waive your right to participate in a class action lawsuit or class-wide arbitration.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">12.3 Governing Law</h3>
            <p className="text-gray-700">
              These Terms are governed by the laws of the United States and the state in which Mowzaic is incorporated, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by email or through a notice on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Termination</h2>
            <p className="text-gray-700">
              Either party may terminate these Terms at any time. You may delete your account at any time. We may suspend or terminate your access to the Platform immediately, without notice, for any reason, including violation of these Terms. Upon termination, your right to use the Platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Entire Agreement</h2>
            <p className="text-gray-700">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Mowzaic regarding the Platform and supersede all prior agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Contact Information</h2>
            <p className="text-gray-700">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 text-gray-700">
              <p>Mowzaic</p>
              <p>Email: support@mowzaic.com</p>
              <p>Website: https://www.mowzaic.com</p>
            </div>
          </section>

          <section className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>By using Mowzaic, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
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
