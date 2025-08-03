import { useEffect, useState } from 'react';

export default function ColdStartWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Show warning after 2 seconds if still loading
    const timer = setTimeout(() => {
      setShowWarning(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Waking up the server...</h3>
        <p className="text-gray-600 text-sm">
          This may take a few seconds on the first load. Subsequent requests will be faster.
        </p>
        <div className="mt-4 bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700">
            💡 This delay only happens after periods of inactivity due to serverless architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
