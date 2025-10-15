'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicy() {
  const { theme } = useTheme();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="hover:underline" style={{ color: '#C8A5FF' }}>
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-6" style={{ color: theme === 'dark' ? '#FFFFFF' : '#4B5563' }}>
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>1. Information We Collect</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            We collect information you provide directly to us, such as when you create an account, 
            upload schedule files, or connect your Google Calendar.
          </p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Account information (email, name)</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Schedule data (shifts, work hours)</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Google Calendar access tokens (for calendar integration)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>2. How We Use Your Information</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Provide and maintain our schedule management service</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Process and display your work schedules</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Sync your shifts with your Google Calendar (when authorized)</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Improve our service and user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>3. Google Calendar Integration</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            When you connect your Google Calendar, we only access your calendar events to:
          </p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Create calendar events for your work shifts</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>View existing events to prevent conflicts</li>
          </ul>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            We use the minimum required permissions and do not access other Google services or personal data.
            You can revoke calendar access at any time through your Google Account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>4. Data Storage and Security</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            Your data is stored securely using industry-standard practices:
          </p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Encrypted database connections</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Secure authentication tokens</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Regular security updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>5. Data Sharing</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            We do not sell, trade, or otherwise transfer your personal information to third parties.
            Your schedule data remains private and is only accessible to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>6. Your Rights</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>You have the right to:</p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Access your personal data</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Correct inaccurate data</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Delete your account and associated data</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Disconnect Google Calendar integration</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>7. Contact Us</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            If you have any questions about this Privacy Policy, please contact us through our 
            <Link href="https://linkedin.com/in/ibrahim-al-omran" className="hover:underline ml-1" style={{ color: '#C8A5FF' }}>
              LinkedIn page
            </Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>8. Changes to This Policy</h2>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
          </p>
        </section>
      </div>
    </div>
  );
}
