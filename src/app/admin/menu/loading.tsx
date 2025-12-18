export default function MenuLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="h-9 w-48 bg-gray-700 rounded mb-2" />
          <div className="h-5 w-72 bg-gray-700 rounded" />
        </div>
        <div className="h-12 w-44 bg-gray-700 rounded-lg" />
      </div>

      {/* Category Tabs Skeleton */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-4">
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-700 rounded-lg" />
          <div className="h-10 w-28 bg-gray-700 rounded-lg" />
          <div className="h-10 w-36 bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="flex items-center justify-end">
        <div className="h-12 w-full max-w-md bg-gray-700 rounded-lg" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-700 rounded" />
              <div className="w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-5 bg-gray-700 rounded w-24" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-6 w-20 bg-gray-700 rounded-full" />
                <div className="flex gap-2">
                  <div className="h-9 w-9 bg-gray-700 rounded-lg" />
                  <div className="h-9 w-9 bg-gray-700 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
