import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-zinc-800 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  );
};

export const PersonaCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton width={48} height={48} rounded="full" />
      <div className="flex-1">
        <Skeleton width="60%" height={20} className="mb-2" />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
    <Skeleton width="100%" height={60} className="mb-3" />
    <div className="flex gap-2">
      <Skeleton width={80} height={24} />
      <Skeleton width={80} height={24} />
      <Skeleton width={80} height={24} />
    </div>
  </div>
);

export const SegmentCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
    <Skeleton width="40%" height={24} className="mb-4" />
    <Skeleton width="100%" height={60} className="mb-4" />
    <div className="grid grid-cols-3 gap-2">
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
    <Skeleton width="30%" height={20} className="mb-4" />
    <Skeleton width="100%" height={300} />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4
}) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-2">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} width="100%" height={40} />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex justify-between items-end">
      <div>
        <Skeleton width={200} height={32} className="mb-2" />
        <Skeleton width={400} height={16} />
      </div>
      <div className="flex gap-3">
        <Skeleton width={120} height={40} />
        <Skeleton width={120} height={40} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton width="100%" height={150} rounded="xl" />
      <Skeleton width="100%" height={150} rounded="xl" />
      <Skeleton width="100%" height={150} rounded="xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton width="100%" height={400} rounded="xl" />
      <Skeleton width="100%" height={400} rounded="xl" />
    </div>
  </div>
);

export default Skeleton;



