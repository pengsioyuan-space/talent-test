export function OptionCard({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border p-5 transition shadow-sm",
        "bg-white hover:bg-violet-50",
        checked ? "border-violet-600 ring-2 ring-violet-200" : "border-slate-200"
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className={[
          "h-5 w-5 rounded-full border grid place-items-center",
          checked ? "border-violet-600" : "border-slate-300"
        ].join(" ")}>
          {checked && <div className="h-2.5 w-2.5 rounded-full bg-violet-600" />}
        </div>
        <div className="font-medium">{label}</div>
      </div>
    </button>
  );
}