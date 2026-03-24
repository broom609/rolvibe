export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-[#A1A1AA] text-sm leading-relaxed">
        <p><strong className="text-[#F4F4F5]">Last updated: March 2026</strong></p>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">What we collect</h2>
        <p>We collect your email address when you sign up, usage data (which apps you try and interact with), and any profile information you choose to provide. We do not sell your data.</p>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">How we use it</h2>
        <p>We use your data to operate the platform, send transactional emails (app approvals, rejections, welcome emails), and improve the discovery feed.</p>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">Third parties</h2>
        <p>We use Supabase for authentication and data storage, Stripe for payment processing, and Resend for email delivery. Each of these services has their own privacy policies.</p>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">Cookies</h2>
        <p>We use cookies strictly for authentication (session management via Supabase Auth). We do not use advertising cookies.</p>
        <h2 className="text-lg font-semibold text-[#F4F4F5]">Your rights</h2>
        <p>You can request deletion of your account and data by emailing <a href="mailto:hello@rolvibe.com" className="text-[#F4F4F5] underline">hello@rolvibe.com</a>. We will process deletion requests within 30 days.</p>
      </div>
    </div>
  )
}
