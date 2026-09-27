import { ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { PantallaCarga } from "@/components/ui/pantalla-anillos";

export default function SignUpLayout({ children }) {
  return (
    <ClerkProvider>
      <ClerkLoading><PantallaCarga /></ClerkLoading>
      {children}
    </ClerkProvider>
  );
}
