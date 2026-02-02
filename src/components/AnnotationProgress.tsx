import React, { useEffect, useState } from 'react';

interface AnnotationItem {
  [key: string]: any;
}

interface AnnotationProgressProps {
  demoMode?: boolean;
}

const AnnotationProgress: React.FC<AnnotationProgressProps> = ({ demoMode = false }) => {
  const [total, setTotal] = useState<number>(0);
  const [annotated, setAnnotated] = useState<number>(0);
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
        const indostereoset: AnnotationItem[] = await indostereosetRes.json();
        const annotationLog: AnnotationItem[] = await annotationLogRes.json();
        setTotal(indostereoset.length);
        // Count annotated items (assuming non-empty objects in annotation_log.json are annotated)
        let annotatedCount = annotationLog.filter(item => Object.keys(item).length > 0).length;
        
        // Demo mode: show 75% progress
        if (demoMode) {
          annotatedCount = Math.floor(indostereoset.length * 0.75);
        }
        
        setAnnotated(annotatedCount);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };
    fetchData();
  }, [demoMode]);

  if (loading) return <div>Loading annotation progress...</div>;
  if (error) return <div>Error: {error}</div>;

  const percent = total > 0 ? Math.round((annotated / total) * 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto my-8 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-2">Annotation Progress {demoMode && '(Demo Mode: 75%)'}</h2>
      <div className="mb-2">{annotated} of {total} annotated ({percent}%)</div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default AnnotationProgress;
