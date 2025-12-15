import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {"{{LAST_UPDATED}}"}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to {"Spicy vs Sweet"}. These Terms of Service ("Terms") govern your use of our service. By accessing or using {"Spicy vs Sweet"}, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Service Provider</h2>
            <p className="text-gray-700 mb-2">{"Spicy vs Sweet"} is operated by:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Company:</strong> {"{{COMPANY_NAME}}"}</p>
              <p className="text-gray-700"><strong>Address:</strong> {"{{COMPANY_ADDRESS}}"}</p>
              {/* Add additional company details as needed */}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Service Description</h2>
            <p className="text-gray-700 mb-2">
              {"Spicy vs Sweet"} provides AI-powered analysis services. The service evaluates content and provides actionable feedback.
            </p>
            <p className="text-gray-700">
              We offer multiple service tiers:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 mt-2 space-y-1">
              <li><strong>Free Trial:</strong> 1 analysis without sign-up (tracked by IP and browser fingerprint for 30 days)</li>
              <li><strong>Free Plan:</strong> 5 analyses per month (requires account registration)</li>
              <li><strong>Pro Plan:</strong> 250 analyses per month at $5/month (requires payment)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. User Accounts</h2>
            <p className="text-gray-700 mb-2">
              To access certain features, you must create an account using Google Authentication. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p className="text-gray-700 mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Attempt to bypass usage limits or abuse the free trial system</li>
              <li>Share your account credentials with others</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code</li>
              <li>Use the service to send spam or malicious content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt the service or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Payment and Subscriptions</h2>
            <p className="text-gray-700 mb-2">
              Pro Plan subscriptions are processed through Stripe and billed monthly at $5/month.
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>You can cancel your subscription at any time through your account settings</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>No refunds are provided for partial months</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Privacy</h2>
            <p className="text-gray-700 mb-2">
              We take your privacy seriously:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Content submitted for analysis is processed by Google's Vertex AI</li>
              <li>We do not store your content permanently</li>
              <li>Free trial usage is tracked using hashed IP addresses (SHA-256) for privacy</li>
              <li>User data is stored in Firebase Firestore with strict security rules</li>
              <li>Analytics are collected using Firebase Analytics (production only)</li>
              <li>We comply with GDPR and applicable data protection laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-2">
              All content, features, and functionality of {"Spicy vs Sweet"} are owned by {"{{COMPANY_NAME}}"} and protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700">
              You retain ownership of the content you submit for analysis. By using our service, you grant us a limited license to process and analyze your content solely for the purpose of providing the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-gray-700">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 mt-2 space-y-1">
              <li>The service will be uninterrupted, timely, secure, or error-free</li>
              <li>The results obtained from using the service will be accurate or reliable</li>
              <li>Any errors in the service will be corrected</li>
              <li>The AI analysis will guarantee improved results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {"{{COMPANY_NAME}}"} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 mt-2 space-y-1">
              <li>Your use or inability to use the service</li>
              <li>Unauthorized access to or alteration of your transmissions or data</li>
              <li>Any content obtained from the service</li>
              <li>Any reliance on analysis results provided by the AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Service Modifications</h2>
            <p className="text-gray-700">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
            <p className="text-gray-700">
              These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or the use of the service shall be subject to the exclusive jurisdiction of the competent courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes by updating the "Last updated" date. Continued use of the service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
              <p className="text-gray-700">{"{{COMPANY_NAME}}"}</p>
              <p className="text-gray-700">{"{{COMPANY_ADDRESS}}"}</p>
              <p className="text-gray-700">{"{{SUPPORT_EMAIL}}"}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-700 underline">
            Terms and Conditions
          </Link>
          {' • '}
          <Link to="/" className="text-blue-600 hover:text-blue-700 underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
