import Link from "next/link";

export const metadata = { title: "House Rules, Terms & Privacy — UNC Thoughts" };

// Plain-English legal cover: community guidelines, terms of use, privacy and
// parent/guardian notes, written for an Australian (NSW) audience. This is a
// solid baseline, not a substitute for tailored legal advice.

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mt-8 mb-2 normal-case tracking-normal">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-paper-dim leading-relaxed mb-2">{children}</p>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm text-paper-dim leading-relaxed">{children}</li>;
}

export default function TermsPage() {
  return (
    <div className="pb-8">
      <p className="eyebrow">UNC Thoughts</p>
      <h1 className="text-2xl">House Rules, Terms &amp; Privacy</h1>
      <p className="text-xs text-grey mt-1">Last updated 3 August 2026 · Sydney, New South Wales, Australia</p>

      <H>The short version</H>
      <ul className="list-disc pl-5 space-y-1">
        <LI>This app shares one person&apos;s lived experience in basketball, nutrition and mindset. It&apos;s general education — <strong>not</strong> medical, dietary, psychological or other professional advice.</LI>
        <LI>You can use almost everything <strong>anonymously</strong>. We don&apos;t ask for your name, email or school.</LI>
        <LI>Every question sent to UNC — and every community (Huddle) post — is read and verified by a human before anyone else sees it.</LI>
        <LI>Be decent. Zero tolerance for bullying, hate or creepy behaviour.</LI>
        <LI>Under 18? You&apos;re welcome here — and we&apos;d love a parent or guardian to know you use the app.</LI>
      </ul>

      <H>House rules (community guidelines)</H>
      <ul className="list-disc pl-5 space-y-1">
        <LI><strong>Hype, don&apos;t hurt.</strong> Questions and answers here build people up. Bullying, harassment, hate speech, discrimination or sexual content — instant removal, no second chances.</LI>
        <LI><strong>No personal details.</strong> Don&apos;t put full names, schools, addresses or phone numbers in a question — yours or anyone else&apos;s. We may edit or delete questions containing them.</LI>
        <LI><strong>Real questions only.</strong> Spam, trolling or impersonating someone else gets you blocked.</LI>
        <LI><strong>Answers may be shared.</strong> A great question can be answered publicly (in the app or on social media) — always <strong>anonymised</strong>, never with your name or details unless you explicitly gave a name and we ask you first.</LI>
      </ul>

      <H>Beta — help us make it better</H>
      <P>UNC Thoughts is in <strong>beta</strong>: features will change, and occasionally something may be wrong, missing or broken. Content and features are provided on an &quot;as available&quot; basis while we build. If you spot a discrepancy — a wrong detail, a bug, anything off — please tell us via &quot;Ask UNC himself&quot; in the app or DM <a className="underline" href="https://instagram.com/uncthoughts" target="_blank" rel="noreferrer">@uncthoughts</a>. Reports genuinely shape what gets fixed first.</P>

      <H>Age &amp; access</H>
      <P>You must tell the truth about your age at the door. Under 13, you can only use the app together with a parent or guardian who accepts these terms on your behalf — on your own, you can&apos;t proceed. If we discover an age was misrepresented, we may remove content and block access. Community features are human-verified before anything is visible, whatever your age.</P>

      <H>What this app is (and isn&apos;t)</H>
      <P>UNC Thoughts provides general information and education based on personal experience and publicly available Australian sport and nutrition guidance. It is not a substitute for advice from a doctor, dietitian, psychologist, or other qualified professional who knows your circumstances. Always check with a professional before changing diet, training or health routines — especially for young, growing athletes.</P>
      <P>The AI feature (&quot;Ask UNC&quot;) only answers from UNC&apos;s approved teaching notes. When it doesn&apos;t know, it says so. Questions that touch on health crises, injuries, eating concerns or safety are deliberately not answered in-app — instead we point you to real help (see below).</P>

      <H>If things are heavy</H>
      <P>If you or someone you know is struggling, talk to a real person today: <strong>000</strong> in an emergency · <strong>Kids Helpline 1800 55 1800</strong> (free, 24/7, for ages 5–25) · <strong>Lifeline 13 11 14</strong> · <strong>13YARN 13 92 76</strong> (Aboriginal &amp; Torres Strait Islander crisis support). A coach&apos;s corner is no replacement for proper support.</P>

      <H>Privacy — anonymous by design</H>
      <ul className="list-disc pl-5 space-y-1">
        <LI>No account or sign-up is required. The app remembers your device with a random ID cookie — it doesn&apos;t know who you are.</LI>
        <LI>We store only what you type: questions, private reflections (encrypted, never used to train AI, never shared unless you choose), and optional context you add (like an age range or allergy note).</LI>
        <LI>Adding your name or Instagram handle to a question is <strong>always optional</strong>.</LI>
        <LI>Notifications are opt-in per device and can be turned off in your browser/phone settings any time.</LI>
        <LI>We never sell data, never run ads, and only share information if the law requires it or someone&apos;s safety depends on it.</LI>
        <LI>Want something deleted? DM <a className="underline" href="https://instagram.com/uncthoughts" target="_blank" rel="noreferrer">@uncthoughts</a> from any account and describe the question or reflection — we&apos;ll remove it.</LI>
        <LI>We handle personal information consistently with the Australian Privacy Principles in the Privacy Act 1988 (Cth).</LI>
      </ul>

      <H>Parents &amp; guardians</H>
      <P>This app is built with young athletes in mind: it&apos;s anonymous, it collects no contact details, nutrition content follows general Australian guidance for growing bodies, sensitive topics are redirected to professional help, and every question to UNC passes through human moderation. Players under 13 should use the app together with you. Questions or concerns? DM <a className="underline" href="https://instagram.com/uncthoughts" target="_blank" rel="noreferrer">@uncthoughts</a> — happy to talk.</P>

      <H>Terms of use</H>
      <ul className="list-disc pl-5 space-y-1">
        <LI>By using the app or sending a question you accept these terms and the house rules above.</LI>
        <LI>Content you submit stays yours; you give us permission to display it in the app and to share answers publicly in anonymised form.</LI>
        <LI>We may moderate, edit for privacy, decline to answer, or remove any content, and may suspend access for rule-breaking.</LI>
        <LI>The app is provided free and &quot;as is&quot;. To the extent permitted by law — and without excluding any consumer guarantees under the Australian Consumer Law that cannot be excluded — we aren&apos;t liable for loss arising from reliance on general information in this app.</LI>
        <LI>These terms are governed by the laws of New South Wales, Australia, and the courts of NSW have jurisdiction over any dispute.</LI>
        <LI>We may update these terms as the app grows; the date above tells you when they last changed.</LI>
      </ul>

      <div className="mt-8">
        <Link href="/member" className="btn text-sm">← Back to the app</Link>
      </div>
    </div>
  );
}
