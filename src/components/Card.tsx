export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={[
      "rounded-3xl bg-white/70 backdrop-blur-md shadow-[0_10px_30px_rgba(17,24,39,0.08)] border border-white/70",
      props.className ?? ""
    ].join(" ")}>
      {props.children}
    </div>
  );
}