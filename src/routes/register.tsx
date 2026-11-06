import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/features/account/auth-form";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — GameVerse" },
      { name: "description", content: "Create your GameVerse account and start playing." },
      { property: "og:title", content: "Register — GameVerse" },
      { property: "og:description", content: "Create your GameVerse account and start playing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() { return <AuthForm register />; }
