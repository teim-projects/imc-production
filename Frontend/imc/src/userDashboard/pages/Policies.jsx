import React, { useState } from "react";
import { motion } from "framer-motion";

const policies = [
  {
    id: "A",
    title: "A. Membership & Registration Policies",
    content: `
1. Membership Validity
• Membership is valid for one (1) year from the date of successful registration and payment.
• Renewal is subject to prevailing terms and fees at the time of renewal.

2. Eligibility & Submission
• Applicants must submit two (2) previously recorded video songs (solo/duet) for evaluation.
• Submissions must be original recordings with clear audio/video quality.

3. Selection & Onboarding
• Selection is based on vocal quality, pitch, rhythm, stage suitability, and overall performance.
• Upon selection, the organiser will share the Membership Form and payment instructions.
• Registration is complete only after full payment confirmation.

4. Minimum Event Commitment
• IMC aims to ensure a minimum of four (4) karaoke musical events per annum for active members.
• Event allocation is subject to availability, suitability, and organiser discretion.

5. Optional Auditorium Participation
• Participation in auditorium or special events is voluntary and based on the singer’s consent.
    `,
  },
  {
    id: "B",
    title: "B. Practice & Performance Policies",
    content: `
6. Practice Sessions
• A minimum of two (2) complimentary practice sessions will be conducted before each event at IMC Studio.

7. Singer & Song Selection
• Singer and song allocation is decided by the organiser based on voice compatibility, event theme, and performance balance.

8. Final Authority
• The final decision regarding singer selection, song order, and performance slots rests solely with IMC Management.

9. Event Hospitality
• During events, snacks and tea will be provided by IMC (subject to venue norms).
    `,
  },
  {
    id: "C",
    title: "C. Booking, Payment & Contribution Policies",
    content: `
10. Event Booking Confirmation
• Event participation is confirmed only after receipt of the applicable contribution.
• Seats/slots are allotted on a first-paid, first-confirmed basis.

11. Contribution Structure
• Auditorium Karaoke Events – ₹1500 per solo song, ₹1000 per partner (duet)
• Live Events – ₹3000 per solo song, ₹1500 per partner (duet)

12. Payment Modes
• UPI / Bank Transfer / Online Payment Gateway
• All applicable taxes or platform charges are borne by the participant.

13. Price Variations
• Contributions may vary based on venue, artists, equipment, or event format.
• Any revisions will be communicated in advance.
    `,
  },
  {
    id: "D",
    title: "D. Cancellation, Refund & Transfer Policies",
    content: `
14. Membership Fees
• Membership fees are non-refundable and non-transferable.

15. Event Cancellation – Auditorium Events Only
• 50% refund if cancellation is informed at least 28 days prior.
• No refund within 29 days of the event.

16. Live Events
• Contributions are non-refundable once paid.

17. Transfer of Participation
• Transfer permitted only with written approval and suitability.
    `,
  },
  {
    id: "E",
    title: "E. Post-Event Policies & Deliverables",
    content: `
18. Media Sharing
• Event photo links will be shared within 3 days post-event.

19. Usage Rights
• IMC may use event media for promotion and marketing.
• Singers may share content with due credit to IMC.
    `,
  },
  {
    id: "F",
    title: "F. Code of Conduct & Common Policies",
    content: `
20. Professional Conduct
• Discipline, punctuality, and respectful behaviour are mandatory.

21. Substance Policy
• Participation under influence of alcohol or drugs is prohibited.

22. Venue Rules
• All venue-specific rules must be followed.

23. Health & Safety
• Singers are responsible for their own health.
• IMC is not liable for personal injury or loss.

24. Force Majeure
• IMC not liable for uncontrollable events.

25. Policy Updates
• Policies may be modified anytime.

26. Acceptance
• Registration or participation implies acceptance.
    `,
  },
  {
    id: "G",
    title: "G. Payment, Billing & Compliance",
    content: `
27. Payment Confirmation
• Booking confirmed only after successful payment.
• IMC not responsible for bank or gateway delays.

28. Invoices & Taxes
• Digital invoices issued.
• GST/service charges applied as per law.

29. Chargebacks & Disputes
• Unauthorized disputes may cause suspension.
• Must be reported within 7 days.
    `,
  },
  {
    id: "H",
    title: "H. Event, Media & Operations",
    content: `
30. Event Recording
• IMC may record media for documentation and memories.
• Media will not be misused.

31. Participant Media Usage
• Singers may use their own content freely.
• Credit to IMC appreciated.

32. Commercial Use
• Commercial resale requires mutual consent.
    `,
  },
  {
    id: "I",
    title: "I. Communication & Support",
    content: `
33. Official Communication
• Updates shared via WhatsApp, email, or IMC platforms.

34. Support
• Issues must be reported politely via official channels.
    `,
  },
  {
    id: "J",
    title: "J. Discipline, Safety & Responsibility",
    content: `
35. Punctuality
• Late arrivals may affect future selection.

36. Behaviour
• Misconduct may lead to removal.

37. Health & Safety
• IMC not liable for negligence or over-exertion.
    `,
  },
  {
    id: "K",
    title: "K. Event Changes & Disclaimer",
    content: `
38. Event Modifications
• IMC may reschedule or cancel events.

39. Force Majeure
• IMC not responsible for uncontrollable events.

40. Policy Updates
• Updates communicated via official channels.
    `,
  },
  {
    id: "L",
    title: "L. Final Acceptance",
    content: `
By registering, making any payment, or participating in IMC activities,
the singer confirms acceptance of all policies stated above.
    `,
  },
];

export default function Policies() {
  const [active, setActive] = useState("A");
  const [agree, setAgree] = useState(false);

  const current = policies.find((p) => p.id === active);

  return (
    <section className="min-h-screen bg-gray-950 text-white px-6 py-14">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-4">
          Singer Registration – Terms & Conditions
        </h1>
        <p className="text-center text-gray-400 mb-10">Team IMC</p>

        {/* Section Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                active === p.id
                  ? "bg-amber-500 text-black"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 p-8 rounded-2xl shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
          <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">
            {current.content}
          </pre>
        </motion.div>

        {/* Acceptance */}
        <div className="text-center mt-10">
          <label className="flex justify-center items-center gap-2 mb-6">
            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
              className="accent-amber-500 w-4 h-4"
            />
            <span>I agree to all terms & policies</span>
          </label>

          <button
            disabled={!agree}
            className={`px-10 py-3 rounded-xl font-bold ${
              agree
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Connect / Continue
          </button>
        </div>
      </div>
    </section>
  );
}
