import React, { useEffect, useState } from 'react';

interface PendingItem {
  target: string;
  bias_type: string;
  context: string;
  sentence: string;
}

interface PendingAnnotationsProps {
  demoMode: boolean;
}

const PendingAnnotations: React.FC<PendingAnnotationsProps> = ({ demoMode }) => {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const indostereosetRes = await fetch('/indostereoset.json');
        const annotationLogRes = await fetch('/annotation_log.json');
        
        if (!indostereosetRes.ok || !annotationLogRes.ok) {
          throw new Error('Failed to load data files');
        }
        
        const indostereoset: any[] = await indostereosetRes.json();
        const annotationLog: any[] = await annotationLogRes.json();

        // In demo mode, show 25% of items as pending
        if (demoMode) {
          const totalItems = indostereoset.length;
          const pendingCount = Math.ceil(totalItems * 0.25);
          const pendingIndices = Array.from(
            { length: pendingCount },
            (_, i) => totalItems - pendingCount + i
          );

          const pending = pendingIndices.map(idx => ({
            target: indostereoset[idx]?.target || 'Unknown',
            bias_type: indostereoset[idx]?.bias_type || 'Unknown',
            context: indostereoset[idx]?.context || '',
            sentence: indostereoset[idx]?.sentence || ''
          }));

          setPendingItems(pending);
        } else {
          setPendingItems([]);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, [demoMode]);

  if (loading) return null;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!demoMode || pendingItems.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
      <h3 className="text-lg font-bold text-yellow-800 mb-4">
        ⚠️ Pending Annotations ({pendingItems.length} items remaining)
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {pendingItems.slice(0, 10).map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-yellow-200">
            <div className="flex gap-2 mb-2">
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-semibold">
                {item.bias_type}
              </span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold">
                {item.target}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1"><strong>Context:</strong> {item.context}</p>
            <p className="text-sm text-gray-700"><strong>Sentence:</strong> {item.sentence}</p>
          </div>
        ))}
        {pendingItems.length > 10 && (
          <div className="text-center text-sm text-gray-600 py-2">
            ... and {pendingItems.length - 10} more items
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingAnnotations;
