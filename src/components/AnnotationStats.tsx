import React, { useEffect, useState } from 'react';

interface AnnotatorStats {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

interface CompletionStats {
  total: number;
  completed: number;
  partial: { count: number; percentage: number };
  pending: { count: number; percentage: number };
  byCount: Record<number, number>;
}

interface AnnotationStatsProps {
  demoMode: boolean;
}

const AnnotationStats: React.FC<AnnotationStatsProps> = ({ demoMode }) => {
  const [annotators, setAnnotators] = useState<AnnotatorStats[]>([]);
  const [completion, setCompletion] = useState<CompletionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const annotationLogRes = await fetch('/annotation_log.json');
        if (!annotationLogRes.ok) {
          throw new Error('Failed to load annotation log');
        }
        const annotationLog: any[] = await annotationLogRes.json();

        // Count annotations per annotator
        const annotatorMap = new Map<string, number>();
        let totalAnnotations = 0;

        annotationLog.forEach((item) => {
          if (item.annotations && Array.isArray(item.annotations)) {
            item.annotations.forEach((ann: any) => {
              const id = ann.annotator_id;
              annotatorMap.set(id, (annotatorMap.get(id) || 0) + 1);
              totalAnnotations++;
            });
          }
        });

        // Create annotator stats
        const annotatorsList = Array.from(annotatorMap.entries())
          .map(([id, count]) => ({
            id,
            name: `user_${id.slice(0, 8)}`,
            count,
            percentage: Math.round((count / totalAnnotations) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setAnnotators(annotatorsList);

        // Calculate completion stats
        const completionMap = new Map<number, number>();
        let total = annotationLog.length;
        let completed = 0;

        annotationLog.forEach((item) => {
          const count = item.annotations?.length || 0;
          completionMap.set(count, (completionMap.get(count) || 0) + 1);
          if (count >= 5) {
            completed++;
          }
        });

        // In demo mode, adjust to show 75% completion
        if (demoMode) {
          const targetCompleted = Math.floor(total * 0.75);
          completed = targetCompleted;
          const diff = annotationLog.length - completed;
          
          completionMap.clear();
          completionMap.set(5, targetCompleted);
          completionMap.set(4, Math.ceil(diff / 2));
          completionMap.set(3, Math.floor(diff / 2));
        }

        const partial = total - completed;
        const partialCount = Array.from(completionMap.entries())
          .filter(([count]) => count < 5)
          .reduce((sum, [, cnt]) => sum + cnt, 0);

        setCompletion({
          total,
          completed,
          partial: {
            count: partialCount,
            percentage: Math.round((partialCount / total) * 100)
          },
          pending: {
            count: total - completed,
            percentage: Math.round(((total - completed) / total) * 100)
          },
          byCount: Object.fromEntries(completionMap)
        });

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
  if (!completion) return null;

  return (
    <div className="w-full max-w-6xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Annotation Statistics</h2>

      {/* Top Annotators */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Annotators</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {annotators.map((annotator, idx) => (
            <div
              key={annotator.id}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-600">#{idx + 1}</span>
              </div>
              <p className="text-xs text-gray-600 mb-1">{annotator.name}</p>
              <p className="text-sm font-bold text-gray-800">{annotator.count} annotations</p>
              <div className="text-xs text-gray-500 mt-1">{annotator.percentage}% of total</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm font-semibold text-gray-600">✓ Completed</p>
          <p className="text-3xl font-bold text-green-600">{completion.completed}</p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round((completion.completed / completion.total) * 100)}% of {completion.total}
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm font-semibold text-gray-600">⏳ Partial</p>
          <p className="text-3xl font-bold text-yellow-600">{completion.partial.count}</p>
          <p className="text-xs text-gray-500 mt-1">{completion.partial.percentage}% in progress</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm font-semibold text-gray-600">⏸ Pending</p>
          <p className="text-3xl font-bold text-red-600">{completion.pending.count}</p>
          <p className="text-xs text-gray-500 mt-1">{completion.pending.percentage}% remaining</p>
        </div>
      </div>

      {/* Completion Breakdown */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Completion Breakdown</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1, 0].map((count) => {
            const itemCount = completion.byCount[count] || 0;
            const percentage = Math.round((itemCount / completion.total) * 100);
            const labels: Record<number, string> = {
              5: '✓ 5/5 Complete',
              4: '⏳ 4/5 Complete',
              3: '⏳ 3/5 Complete',
              2: '⏳ 2/5 Complete',
              1: '⏳ 1/5 Complete',
              0: '⏸ 0/5 Not Started'
            };

            return (
              <div key={count}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{labels[count]}</span>
                  <span className="text-sm text-gray-600">{itemCount} items ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      count === 5
                        ? 'bg-green-500'
                        : count === 0
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnnotationStats;
