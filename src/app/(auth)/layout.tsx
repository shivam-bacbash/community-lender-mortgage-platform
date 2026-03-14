export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 lg:px-12"
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        {children}
      </div>
    </main>
  );
}
