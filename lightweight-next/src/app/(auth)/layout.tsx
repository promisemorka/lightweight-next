import { Navigation } from "@/components/nav/navigation";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
