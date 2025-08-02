import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-purple-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you create an account, 
            upload schedule files, or connect your Google Calendar.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Account information (email, name)</li>
            <li>Schedule data (shifts, work hours)</li>
            <li>Google Calendar access tokens (for calendar integration)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide and maintain our schedule management service</li>
            <li>Process and display your work schedules</li>
            <li>Sync your shifts with your Google Calendar (when authorized)</li>
            <li>Improve our service and user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Google Calendar Integration</h2>
          <p className="mb-4">
            When you connect your Google Calendar, we only access your calendar events to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Create calendar events for your work shifts</li>
            <li>View existing events to prevent conflicts</li>
          </ul>
          <p className="mb-4">
            We use the minimum required permissions and do not access other Google services or personal data.
            You can revoke calendar access at any time through your Google Account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
          <p className="mb-4">
            Your data is stored securely using industry-standard practices:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Encrypted database connections</li>
            <li>Secure authentication tokens</li>
            <li>Regular security updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties.
            Your schedule data remains private and is only accessible to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Disconnect Google Calendar integration</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us through our 
            <Link href="https://linkedin.com/in/ibrahim-al-omran" className="text-purple-600 hover:underline ml-1">
              LinkedIn page
            </Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>
      </div>
    </div>
  );
}
