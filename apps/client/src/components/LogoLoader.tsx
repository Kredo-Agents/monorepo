export default function LogoLoader({ text, className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <img
        src="/logo-footer.png"
        alt=""
        className="h-10 w-10 animate-logo-pulse"
      />
      {text && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{text}</p>
      )}
    </div>
  );
}
