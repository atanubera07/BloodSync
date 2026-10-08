import type { Metadata } from 'next';
import { headers } from 'next/headers';
const questions = [
  {
    question: 'Can BloodSync confirm that I can donate?',
    answer:
      'No. Profile screening is only an initial coordination step. A qualified medical professional must decide eligibility.',
  },
  {
    question: 'When can a request owner see my contact information?',
    answer:
      'Only after you express interest in that request while contact sharing consent is active.',
  },
  {
    question: 'Can I withdraw consent?',
    answer:
      'Yes. Use Withdraw donor consent on your donor profile. Matching and contact sharing stop, and existing interests are removed.',
  },
  {
    question: 'Can I export or delete my account?',
    answer: 'Yes. The account page offers a JSON export and password-confirmed deletion.',
  },
];
export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'Answers about donor approval, contact sharing, consent and account data in BloodSync.',
  alternates: { canonical: '/faq' },
};
export default async function FAQ() {
  const nonce = (await headers()).get('x-nonce') || undefined;
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }).replace(/</g, '\\u003c');
  return (
    <article className="content-panel">
      <h1>Frequently asked questions</h1>
      {questions.map((item) => (
        <section key={item.question}>
          <h2>{item.question}</h2>
          <p>{item.answer}</p>
        </section>
      ))}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />
    </article>
  );
}
