import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-center py-4 border-t border-gray-200 mt-8">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
        <p>
          © 2025 <a href="https://linkedin.com/in/ibrahim-al-omran" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Ibrahim Al Omran</a>
        </p>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-purple-600 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
