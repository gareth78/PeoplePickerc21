export function SkeletonUserCard() {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-full shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded-lg w-3/4 shimmer" />
          <div className="h-3 bg-slate-200 rounded-lg w-1/2 shimmer" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetailPanel() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-slate-200 rounded-lg w-2/3 shimmer" />
          <div className="h-4 bg-slate-200 rounded-lg w-full shimmer" />
          <div className="h-3 bg-slate-200 rounded-full w-24 shimmer" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 bg-slate-200 rounded-lg w-1/4 shimmer" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 rounded-xl shimmer" />
          <div className="h-20 bg-slate-200 rounded-xl shimmer" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-10 bg-slate-200 rounded-xl flex-1 shimmer" />
        <div className="h-10 bg-slate-200 rounded-xl flex-1 shimmer" />
      </div>
    </div>
  );
}
