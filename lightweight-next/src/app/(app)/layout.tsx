import { Navigation } from "@/components/nav/navigation";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
