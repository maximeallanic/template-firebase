import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600">Last updated: {"{{LAST_UPDATED}}"}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. General Information</h2>
            <p className="text-gray-700 mb-2">
              These Terms and Conditions ("Conditions") apply to all purchases and subscriptions made through {"{{APP_NAME}}"}. By purchasing or subscribing to our services, you agree to these Conditions.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="text-gray-700"><strong>Seller:</strong> {"{{COMPANY_NAME}}"}</p>
              <p className="text-gray-700"><strong>Address:</strong> {"{{COMPANY_ADDRESS}}"}</p>
              {/* Add additional company details as needed */}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Services and Pricing</h2>
            <p className="text-gray-700 mb-3">{"{{APP_NAME}}"} offers the following service plans:</p>

            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Free Trial</h3>
                <p className="text-gray-700"><strong>Price:</strong> $0.00</p>
                <p className="text-gray-700"><strong>Includes:</strong> 1 analysis without account registration</p>
                <p className="text-gray-700"><strong>Limitation:</strong> One-time use per device/IP address, tracked for 30 days</p>
                <p className="text-gray-700"><strong>No Payment Required</strong></p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Free Plan</h3>
                <p className="text-gray-700"><strong>Price:</strong> $0.00 per month</p>
                <p className="text-gray-700"><strong>Includes:</strong> 5 analyses per month</p>
                <p className="text-gray-700"><strong>Requirement:</strong> Account registration via Google Authentication</p>
                <p className="text-gray-700"><strong>Reset:</strong> Analysis quota resets monthly</p>
              </div>

              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">Pro Plan</h3>
                <p className="text-gray-700"><strong>Price:</strong> $5.00 USD per month</p>
                <p className="text-gray-700"><strong>Includes:</strong> 250 analyses per month</p>
                <p className="text-gray-700"><strong>Billing:</strong> Monthly, automatic renewal</p>
                <p className="text-gray-700"><strong>Payment Method:</strong> Credit card via Stripe</p>
                <p className="text-gray-700"><strong>Currency:</strong> USD (US Dollars)</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Subscription Process</h2>
            <p className="text-gray-700 mb-2">To subscribe to the Pro Plan:</p>
            <ol className="list-decimal list-inside text-gray-700 ml-4 space-y-2">
              <li>Create an account or sign in using Google Authentication</li>
              <li>Click "Upgrade to Pro" button</li>
              <li>Enter payment details via Stripe secure checkout</li>
              <li>Confirm your subscription</li>
              <li>Receive instant access to 250 monthly analyses</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Payment Terms</h2>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
              <li><strong>Payment Processor:</strong> All payments are processed securely through Stripe, Inc.</li>
              <li><strong>Billing Cycle:</strong> Subscriptions are billed monthly on the same day of each month</li>
              <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li><strong>Payment Methods:</strong> Visa, Mastercard, American Express, and other cards supported by Stripe</li>
              <li><strong>Currency:</strong> Prices are listed in USD and charged in USD</li>
              <li><strong>VAT:</strong> Prices do not include VAT where applicable (will be added at checkout for EU customers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Right of Withdrawal (EU Consumer Protection)</h2>
            <p className="text-gray-700 mb-2">
              <strong>For EU consumers:</strong> You have the right to withdraw from your purchase within 14 days of subscription without giving any reason, in accordance with EU Directive 2011/83/EU.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Important:</strong> By using the service immediately after subscribing, you expressly request that the service begins before the end of the withdrawal period, and you acknowledge that you will lose your right of withdrawal once you have fully consumed your monthly analysis quota.
            </p>
            <p className="text-gray-700">
              To exercise your right of withdrawal within the 14-day period (before fully consuming your quota), you must inform us of your decision by contacting us at the address provided in Section 15.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Cancellation Policy</h2>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
              <li>You may cancel your subscription at any time through your account settings or via Stripe Customer Portal</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>You will retain access to Pro features until the end of your paid period</li>
              <li>No partial refunds are provided for unused days or analyses within a billing period</li>
              <li>After cancellation, your account automatically reverts to the Free Plan (5 analyses/month)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Refund Policy</h2>
            <p className="text-gray-700 mb-2">
              Refunds are handled on a case-by-case basis:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
              <li><strong>EU Right of Withdrawal:</strong> Full refund within 14 days if you have not fully consumed your quota (see Section 5)</li>
              <li><strong>Service Issues:</strong> Refunds may be issued if the service was unavailable or non-functional for an extended period</li>
              <li><strong>Billing Errors:</strong> Refunds for duplicate charges or billing errors will be processed promptly</li>
              <li><strong>No Refunds For:</strong> Change of mind after 14 days, unused analyses, or partial billing periods</li>
              <li><strong>Refund Method:</strong> Refunds are issued to the original payment method within 5-10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Price Changes</h2>
            <p className="text-gray-700">
              We reserve the right to modify subscription prices with 30 days advance notice. Existing subscribers will be notified via email and will have the option to cancel before the new price takes effect. Continued use after the notice period constitutes acceptance of the new pricing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Usage Limits and Fair Use</h2>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
              <li><strong>Free Plan:</strong> 5 analyses per calendar month, reset on the same day you created your account</li>
              <li><strong>Pro Plan:</strong> 250 analyses per calendar month, reset on your billing date</li>
              <li><strong>No Rollover:</strong> Unused analyses do not carry over to the next month</li>
              <li><strong>Fair Use:</strong> Automated or bulk analysis requests may be throttled or blocked</li>
              <li><strong>Abuse Prevention:</strong> Accounts found abusing the service may be suspended without refund</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Service Availability</h2>
            <p className="text-gray-700 mb-2">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance and unexpected outages may occur. We are not liable for:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Temporary service interruptions</li>
              <li>Third-party service failures (Firebase, Google Vertex AI, Stripe)</li>
              <li>Force majeure events (natural disasters, war, government actions, etc.)</li>
              <li>Internet connectivity issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-2">
              <strong>Our IP:</strong> All rights, title, and interest in {"{{APP_NAME}}"}, including software, design, logos, trademarks, and content, belong to {"{{COMPANY_NAME}}"}. You may not copy, modify, distribute, sell, or reverse engineer any part of our service.
            </p>
            <p className="text-gray-700">
              <strong>Your Content:</strong> You retain full ownership of the content you submit for analysis. We process your content solely to provide the service and do not claim any ownership rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Data Protection and Privacy</h2>
            <p className="text-gray-700 mb-2">
              We process personal data in accordance with:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>EU General Data Protection Regulation (GDPR)</li>
              <li>California Consumer Privacy Act (CCPA) where applicable</li>
            </ul>
            <p className="text-gray-700 mt-3 mb-2">
              <strong>Data Processing:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Content is sent to Google Vertex AI for analysis and is not permanently stored</li>
              <li>User account data is stored in Firebase Firestore (Google Cloud)</li>
              <li>Payment data is processed and stored by Stripe, not on our servers</li>
              <li>IP addresses are hashed (SHA-256) for free trial tracking (privacy-preserving)</li>
              <li>Analytics data is collected via Firebase Analytics (production only)</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Your Rights:</strong> You have the right to access, rectify, delete, port, or restrict processing of your personal data. Contact us at the address in Section 15 to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Account Suspension and Termination</h2>
            <p className="text-gray-700 mb-2">
              We may suspend or terminate your account immediately if you:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              <li>Violate these Terms and Conditions</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Abuse the service or attempt to bypass usage limits</li>
              <li>Fail to pay subscription fees (after 7-day grace period)</li>
              <li>Use the service in a manner that harms our reputation or other users</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Upon termination, you lose access to all Pro features and data may be deleted after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Limitation of Liability</h2>
            <p className="text-gray-700 mb-2">
              To the maximum extent permitted by law, {"{{COMPANY_NAME}}"}'s total liability for all claims arising from these Conditions shall not exceed the amount paid by you in the 12 months preceding the claim.
            </p>
            <p className="text-gray-700">
              We are not liable for:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 mt-2 space-y-1">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages resulting from reliance on AI analysis results</li>
              <li>Third-party service failures (Google, Firebase, Stripe, Mailgun)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Dispute Resolution</h2>
            <p className="text-gray-700 mb-2">
              <strong>Governing Law:</strong> These Conditions are governed by applicable laws.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Mediation (EU Consumers):</strong> Before initiating legal proceedings, EU consumers can attempt to resolve disputes through mediation. We are committed to participating in good faith in any mediation process.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>ODR Platform:</strong> EU consumers can also use the European Commission's Online Dispute Resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">https://ec.europa.eu/consumers/odr</a>
            </p>
            <p className="text-gray-700">
              <strong>Jurisdiction:</strong> Any disputes that cannot be resolved amicably shall be subject to the exclusive jurisdiction of the competent courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Contact Information</h2>
            <p className="text-gray-700 mb-2">
              For questions about these Terms and Conditions, billing, refunds, or to exercise your rights:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>{"{{COMPANY_NAME}}"}</strong></p>
              <p className="text-gray-700">{"{{COMPANY_ADDRESS}}"}</p>
              <p className="text-gray-700">{"{{SUPPORT_EMAIL}}"}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Changes to Terms and Conditions</h2>
            <p className="text-gray-700">
              We may update these Terms and Conditions from time to time. Significant changes will be communicated via email to registered users. The "Last updated" date at the top indicates when the latest changes were made. Continued use of the service after changes indicates acceptance of the updated Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">18. Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms and Conditions is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">19. Entire Agreement</h2>
            <p className="text-gray-700">
              These Terms and Conditions, together with our Terms of Service, constitute the entire agreement between you and {"{{COMPANY_NAME}}"} regarding your use of {"{{APP_NAME}}"} and supersede all prior agreements and understandings.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 underline">
            Terms of Service
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

export default TermsAndConditions;
