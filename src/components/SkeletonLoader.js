import React from 'react';

const SkeletonLoader = ({ variant = 'line', count = 1, className = '' }) => {
  const renderSkeleton = (key) => {
    switch (variant) {
      case 'card':
        return (
          <div key={key} className={`skeleton skeleton-card h-[120px] rounded-sharp ${className}`} />
        );
      case 'avatar':
        return (
          <div key={key} className={`skeleton skeleton-avatar w-12 h-12 rounded-full ${className}`} />
        );
      case 'booking-card':
        return (
          <div key={key} className={`p-4 rounded-sharp border border-white/10 bg-surface ${className}`}>
            <div className="skeleton skeleton-line h-[14px] w-1/3 mb-4 rounded-full" />
            <div className="skeleton skeleton-line h-[14px] w-full mb-2 rounded-full" />
            <div className="skeleton skeleton-line h-[14px] w-2/3 rounded-full" />
          </div>
        );
      case 'profile':
        return (
          <div key={key} className={`flex items-center gap-4 ${className}`}>
            <div className="skeleton skeleton-avatar w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-col gap-2 w-full flex">
              <div className="skeleton skeleton-line h-[14px] w-full rounded-full" />
              <div className="skeleton skeleton-line h-[14px] w-3/5 rounded-full" />
            </div>
          </div>
        );
      case 'line':
      default:
        return (
          <div key={key} className={`flex flex-col gap-2 ${className}`}>
            <div className="skeleton skeleton-line h-[14px] w-full rounded-full" />
            <div className="skeleton skeleton-line h-[14px] w-full rounded-full" />
            <div className="skeleton skeleton-line h-[14px] w-[60%] rounded-full" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </>
  );
};

export default SkeletonLoader;
