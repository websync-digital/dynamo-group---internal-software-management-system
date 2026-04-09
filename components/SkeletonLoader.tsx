import React from 'react';

const SkeletonLoader = () => (
  <div className="w-full space-y-8 p-4 md:p-8 animate-pulse duration-700">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div className="space-y-4 w-full md:w-1/3">
        <div className="h-10 bg-gray-200 rounded-xl w-3/4"></div>
        <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-12 bg-gray-100 rounded-2xl w-32"></div>
        <div className="h-12 bg-green-100 rounded-2xl w-40"></div>
      </div>
    </div>
    
    {/* Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3 w-full">
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="h-12 w-12 bg-gray-50 rounded-xl"></div>
          </div>
          <div className="h-2 bg-gray-50 rounded w-1/3 mt-2"></div>
        </div>
      ))}
    </div>

    {/* Body Section Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-12 bg-gray-100 rounded-2xl w-full"></div>
        {[...Array(3)].map((_, i) => (
          <div key={`row-${i}`} className="h-24 bg-white border border-gray-50 rounded-2xl w-full flex items-center p-6 gap-6">
            <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
            <div className="h-8 bg-gray-100 rounded-lg w-24"></div>
          </div>
        ))}
      </div>
      
      {/* Sidebar Skeleton */}
      <div className="space-y-6">
        <div className="h-[400px] bg-white border border-gray-50 rounded-[2rem] p-8 space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-50 rounded-xl w-full"></div>
            <div className="h-12 bg-gray-50 rounded-xl w-full"></div>
            <div className="h-12 bg-gray-50 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonLoader;
