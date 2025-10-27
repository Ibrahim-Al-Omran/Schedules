'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicy() {
  const { theme } = useTheme();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="hover:underline" style={{ color: '#C8A5FF' }}>
          ← Back to Home
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
            Schedules uses the Google Calendar API to sync your work shifts with your Google Calendar. 
            When you authorize our application, we request the following permissions:
          </p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}><strong>View and edit events on all your calendars</strong> - This allows us to create calendar events for your work shifts and view existing events to help you manage your schedule</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}><strong>See and download any calendar you can access using your Google Calendar</strong> - This enables you to select which specific calendar you want your shifts synced to</li>
          </ul>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <strong>How we use Google Calendar data:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>We only create events for work shifts you have entered into our application</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>We do not read, modify, or delete any other events in your calendar</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>We do not share your Google Calendar data with any third parties</li>
            <li style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>Calendar access tokens are stored securely and encrypted in our database</li>
          </ul>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            You can revoke Schedules' access to your Google Calendar at any time by visiting your 
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="hover:underline ml-1" style={{ color: '#C8A5FF' }}>
              Google Account Permissions
            </a> page, or by disconnecting within the Schedules app settings.
          </p>
          <p className="mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <strong>Schedules' use and transfer of information received from Google APIs adheres to the 
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="hover:underline ml-1" style={{ color: '#C8A5FF' }}>
              Google API Services User Data Policy
            </a>, including the Limited Use requirements.</strong>
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
            If you have any questions about this Privacy Policy or how we handle your data, please contact us:
          </p>
          <ul className="list-none pl-0 mb-4" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
            <li className="mb-2" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
              Website: <a href="https://schedulesapp.org" className="hover:underline" style={{ color: '#C8A5FF' }}>schedulesapp.org</a>
            </li>
            <li className="mb-2" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
              GitHub: <a href="https://github.com/Ibrahim-Al-Omran/Schedules" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#C8A5FF' }}>github.com/Ibrahim-Al-Omran/Schedules</a>
            </li>
            <li className="mb-2" style={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>
              Developer: <a href="https://linkedin.com/in/ibrahim-al-omran" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#C8A5FF' }}>LinkedIn - Ibrahim Al-Omran</a>
            </li>
          </ul>
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
