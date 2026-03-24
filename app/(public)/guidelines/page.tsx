export default function GuidelinesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-8">Creator Guidelines</h1>
      <div className="space-y-6 text-[#A1A1AA] text-sm leading-relaxed">
        <p>Rolvibe is built for vibe coders. Here&apos;s what we accept and what we don&apos;t.</p>
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4">
          <h2 className="text-base font-semibold text-green-400 mb-3">✓ We accept</h2>
          <ul className="space-y-1.5">
            {[
              'Apps built with AI coding tools (Cursor, Lovable, Bolt, v0, Replit, Windsurf, Claude Code, etc.)',
              'Functional apps that actually work and are accessible via URL',
              'Free, paid, subscription, and invite-only apps',
              'NSFW apps (must be flagged appropriately)',
              'Early-stage and experimental projects',
              'Apps in any category — tools, games, utilities, creative apps',
            ].map(item => <li key={item} className="flex gap-2"><span className="text-green-400 flex-shrink-0">•</span>{item}</li>)}
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
          <h2 className="text-base font-semibold text-red-400 mb-3">✗ We don&apos;t accept</h2>
          <ul className="space-y-1.5">
            {[
              'Apps you didn\'t build yourself',
              'Phishing, scam, or malware apps',
              'Apps that collect user data without disclosure',
              'Broken apps that don\'t load',
              'Plagiarized or copyright-infringing apps',
              'Apps designed to mislead or defraud users',
            ].map(item => <li key={item} className="flex gap-2"><span className="text-red-400 flex-shrink-0">•</span>{item}</li>)}
          </ul>
        </div>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">Review process</h2>
        <p>Every app is reviewed by a human before going live. We aim to review submissions within 24 hours. If your app is rejected, you&apos;ll receive an email with the reason and you can revise and resubmit.</p>
        <p>Questions? <a href="mailto:hello@rolvibe.com" className="text-[#F4F4F5] underline">hello@rolvibe.com</a></p>
      </div>
    </div>
  )
}
