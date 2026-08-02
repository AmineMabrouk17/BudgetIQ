export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
