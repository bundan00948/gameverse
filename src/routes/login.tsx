import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/features/account/auth-form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — GameVerse" },
      { name: "description", content: "Log in to your GameVerse account." },
      { property: "og:title", content: "Login — GameVerse" },
      { property: "og:description", content: "Log in to your GameVerse account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() { return <AuthForm />; }
