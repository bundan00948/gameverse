import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — GameVerse" },
      { name: "description", content: "The rules and terms for using GameVerse." },
      { property: "og:title", content: "Terms of Service — GameVerse" },
      { property: "og:description", content: "The rules and terms for using GameVerse." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    title: "1. Accounts",
    body: "You are responsible for keeping your account secure. One account per person; sharing or selling accounts is not allowed.",
  },
  {
    title: "2. Trading",
    body: "All in-game items have no real-world value. Trading items for real money or outside services is prohibited.",
  },
  {
    title: "3. Community conduct",
    body: "Be respectful. Harassment, hate speech, scams and cheating will result in suspension or a permanent ban.",
  },
  {
    title: "4. Changes",
    body: "These terms may be updated at any time. Continued use of the site means you accept the latest version.",
  },
];

function Terms() {
  return (
    <main className="bg-tiles min-h-screen px-4 py-16">
      <article className="mx-auto max-w-2xl rounded-xl bg-card/95 p-8 shadow-2xl sm:p-12">
        <Link to="/" className="font-display text-5xl">
          GameVerse
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Terms of Service</h1>
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
        <Link to="/" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </article>
    </main>
  );
}
