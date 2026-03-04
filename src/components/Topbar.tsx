export function Topbar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md border-b border-white/70">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-600 shadow-[0_12px_40px_rgba(139,92,246,0.25)] grid place-items-center text-white font-bold">
            ★
          </div>
          <div>
            <div className="font-semibold leading-tight">天赋测试</div>
            <div className="text-xs text-slate-500">Talent Assessment</div>
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}