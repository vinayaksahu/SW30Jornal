export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">SW30 Journal</h1>
          <p className="mt-2 text-sm text-zinc-400">Professional Trading Journal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
