export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <p><strong className="text-[var(--text-primary)]">Last updated: March 2026</strong></p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">1. Using Rolvibe</h2>
        <p>Rolvibe is a discovery marketplace for apps built with AI tools. By using this platform, you agree to these terms. You must be 13 or older to use Rolvibe.</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">2. Creator Responsibilities</h2>
        <p>If you list an app on Rolvibe, you confirm that it is your own work, that it does not violate any third-party rights, and that it complies with our creator guidelines. You are responsible for the apps you submit.</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">3. Payments</h2>
        <p>Rolvibe facilitates payments between buyers and creators. We retain a 10% platform fee on all paid transactions. Creators are responsible for their own tax obligations.</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">4. Content Policy</h2>
        <p>We reserve the right to remove any app that violates our guidelines, is harmful to users, or that we determine is unsuitable for the platform.</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">5. Limitation of Liability</h2>
        <p>Rolvibe is provided &ldquo;as is&rdquo;. We are not liable for the behavior of apps listed on the platform. Use apps at your own discretion.</p>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">6. Changes</h2>
        <p>We may update these terms from time to time. Continued use of Rolvibe after changes constitutes acceptance.</p>
        <p>Questions? Email us at <a href="mailto:hello@rolvibe.com" className="text-[var(--text-primary)] underline">hello@rolvibe.com</a></p>
      </div>
    </div>
  )
}
