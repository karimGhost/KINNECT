export default function PostSkeleton() {
  return (
    <div className="max-w-xl mx-auto p-4 bg rounded-lg focus-glow shadow-md outline animate-pulse space-y-4">
      {/* Header: avatar + username */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full shadow animated outline" />
        <div className="h-4 shadow animated outline rounded w-32" />
      </div>

      {/* Text lines */}
      <div className="space-y-2 ">
        <div className="h-4 shadow animated outline rounded w-full sm:w-5/6" />
        <div className="h-4 shadow animated outline rounded w-full sm:w-4/6" />
        <div className="h-4 shadow animated outline rounded w-3/4 sm:w-2/6" />
      </div>

      {/* Media thumbnail */}
      <div className="shadow animated outline rounded-md w-full h-48 sm:h-64 focus-glowC" />

      {/* Footer icons */}
      <div className="flex justify-between mt-2">
        <div className="h-6 w-20 shadow animated outline rounded" />
        <div className="h-6 w-20 shadow animated outline rounded" />
        <div className="h-6 w-20 shadow animated outline rounded" />
      </div>
    </div>
  );
}
