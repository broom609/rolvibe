export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">About Rolvibe</h1>
      <p className="gradient-text text-lg font-semibold mb-8">Where vibe coders get discovered.</p>
      <div className="space-y-5 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p>
          There are thousands of people building real, functional apps every week — not with years of engineering experience, but with AI tools like Cursor, Lovable, Bolt, v0, and Replit. They&apos;re called vibe coders. And until now, they had nowhere to get discovered.
        </p>
        <p>
          Rolvibe is the discovery marketplace for vibe-coded apps. Think of it like Roblox&apos;s game feed but every card is a real app someone built this week. Browse by category, try apps instantly, and find the next tool you didn&apos;t know you needed.
        </p>
        <p>
          If you&apos;re a creator, Rolvibe gives you a place to share what you built, get feedback, and start building an audience. List your app for free, set your own pricing, and let people find you.
        </p>
        <p>
          If you&apos;re a user, Rolvibe is the fastest way to discover the next wave of useful, weird, and interesting apps — before they blow up.
        </p>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mt-8">
          <p className="text-[var(--text-primary)] font-semibold mb-2">Built by a vibe coder, for vibe coders.</p>
          <p>Rolvibe was built entirely with AI coding tools. Questions, ideas, or feedback: <a href="mailto:hello@rolvibe.com" className="text-[var(--text-primary)] underline">hello@rolvibe.com</a></p>
        </div>
      </div>
    </div>
  )
}
