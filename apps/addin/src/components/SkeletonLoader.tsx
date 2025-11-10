export function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded skeleton w-3/4" />
              <div className="h-3 bg-slate-200 rounded skeleton w-1/2" />
              <div className="h-3 bg-slate-200 rounded skeleton w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-200 skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-slate-200 rounded skeleton w-3/4" />
          <div className="h-4 bg-slate-200 rounded skeleton w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded skeleton w-full" />
        <div className="h-4 bg-slate-200 rounded skeleton w-5/6" />
        <div className="h-4 bg-slate-200 rounded skeleton w-4/6" />
      </div>
    </div>
  );
}
