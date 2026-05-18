import { useState } from "react";
import { Link } from "react-router-dom";
import { FaTint, FaHeart, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdBloodtype, MdLocalHospital, MdInfo, MdWarning, MdCheckCircle } from "react-icons/md";

const toneClasses = {
  red: { bg: "bg-red-100", text: "text-red-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

const faqs = [
  {
    q: "Who can donate blood?",
    a: "Anyone between 18–65 years old, weighing at least 50 kg, and in good health can donate blood. You should not have donated blood in the last 3 months (for whole blood).",
  },
  {
    q: "How often can I donate blood?",
    a: "Whole blood can be donated once every 3 months (90 days). Platelets can be donated every 2 weeks, and plasma every 4 weeks.",
  },
  {
    q: "Does donating blood hurt?",
    a: "You may feel a brief pinch when the needle is inserted, but the donation process itself is generally painless. Most donors feel fine throughout.",
  },
  {
    q: "How long does the donation process take?",
    a: "The actual blood draw takes about 8–10 minutes. Including registration, health check, and rest time, the entire visit is typically 45–60 minutes.",
  },
  {
    q: "Will I feel weak after donating?",
    a: "Most donors feel perfectly fine. You may feel slightly lightheaded immediately after. Drinking fluids and having a snack before and after donation helps prevent this.",
  },
  {
    q: "Can I donate if I have a tattoo or piercing?",
    a: "Yes, but you must wait 6 months after getting a tattoo or piercing from an unregulated facility. If done at a licensed, sterile facility, check with your blood bank.",
  },
  {
    q: "Is my blood tested after donation?",
    a: "Yes. Every unit of donated blood is screened for HIV, Hepatitis B, Hepatitis C, syphilis, and malaria before it is used for transfusion.",
  },
  {
    q: "What blood type is the rarest?",
    a: "AB negative is the rarest blood type, found in only about 1% of the population. O negative is the universal donor type and is always in high demand.",
  },
];

const bloodTypes = [
  { type: "A+", canDonateTo: ["A+", "AB+"], canReceiveFrom: ["A+", "A−", "O+", "O−"], frequency: "35.7%" },
  { type: "A−", canDonateTo: ["A+", "A−", "AB+", "AB−"], canReceiveFrom: ["A−", "O−"], frequency: "6.3%" },
  { type: "B+", canDonateTo: ["B+", "AB+"], canReceiveFrom: ["B+", "B−", "O+", "O−"], frequency: "8.5%" },
  { type: "B−", canDonateTo: ["B+", "B−", "AB+", "AB−"], canReceiveFrom: ["B−", "O−"], frequency: "1.5%" },
  { type: "AB+", canDonateTo: ["AB+"], canReceiveFrom: ["All Types"], frequency: "3.4%" },
  { type: "AB−", canDonateTo: ["AB+", "AB−"], canReceiveFrom: ["A−", "B−", "AB−", "O−"], frequency: "0.6%" },
  { type: "O+", canDonateTo: ["A+", "B+", "O+", "AB+"], canReceiveFrom: ["O+", "O−"], frequency: "37.4%" },
  { type: "O−", canDonateTo: ["All Types"], canReceiveFrom: ["O−"], frequency: "6.6%" },
];

const steps = [
  { step: "01", color: "red", title: "Register Online", desc: "Create your BloodConnect account as a donor in minutes. No paperwork needed." },
  { step: "02", color: "orange", title: "Health Screening", desc: "A quick check of your hemoglobin, blood pressure, pulse, and temperature at the donation center." },
  { step: "03", color: "blue", title: "The Donation", desc: "About 450ml of blood is drawn — takes just 8–10 minutes. You're in safe hands." },
  { step: "04", color: "green", title: "Rest & Refresh", desc: "Relax for 10–15 minutes, enjoy juice and snacks provided by the center." },
  { step: "05", color: "purple", title: "Go Save a Life", desc: "Your blood is tested, processed, and sent to patients who need it within 24 hours." },
];

const eligibility = {
  canDonate: [
    "Age 18–65 years",
    "Weight ≥ 50 kg",
    "Hemoglobin ≥ 12.5 g/dL",
    "Normal blood pressure",
    "No fever or cold",
    "Last donation 90+ days ago",
    "Good sleep the night before",
  ],
  cannotDonate: [
    "Pregnant or breastfeeding",
    "Recent surgery (< 6 months)",
    "HIV, Hepatitis B/C positive",
    "Active cancer treatment",
    "Recent tattoo (< 6 months, unregulated)",
    "Severe heart or lung disease",
    "Under certain medications",
  ],
};

const FAQ = ({ q, a, open, onToggle }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left transition-colors ${
          open
            ? "bg-red-50/70 dark:bg-red-900/20"
            : "hover:bg-gray-50 dark:hover:bg-gray-900"
        }`}
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base pr-4 leading-relaxed">{q}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
          open
            ? "border-red-200 dark:border-red-700 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400"
        }`}>
          {open ? <FaChevronUp className="flex-shrink-0" /> : <FaChevronDown className="flex-shrink-0" />}
        </span>
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-5 pt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-red-100 dark:border-red-900/40 bg-gradient-to-b from-red-50/40 to-white dark:from-red-900/10 dark:to-gray-800">
          {a}
        </div>
      )}
    </div>
  );
};

const Learn = () => {
  const [activeType, setActiveType] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="public-page">

      {/* Hero */}
      <section className="public-hero py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="public-hero-badge">
            <MdInfo className="text-red-600 dark:text-red-300" />
            Education & Awareness
          </div>
          <h1 className="public-hero-title">
            Learn About <br />
            <span className="text-yellow-300">Blood Donation</span>
          </h1>
          <p className="public-hero-subtitle">
            Everything you need to know about donating blood — eligibility,
            blood types, the donation process, and answers to your most common questions.
          </p>
          <Link
            to="/donor/register"
              className="inline-block px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm"
          >
            🩸 Ready to Donate? Register Now
          </Link>
        </div>
      </section>

      {/* Why Donate */}
      <section className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Why Donate Blood?</h2>
            <p className="public-section-subtitle max-w-xl mx-auto">
              One donation can save up to 3 lives. Here's why your blood matters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FaHeart, color: "red", title: "Save Up to 3 Lives", desc: "A single whole blood donation is separated into red cells, platelets, and plasma — each saving a different patient." },
              { icon: MdBloodtype, color: "blue", title: "Blood Has No Substitute", desc: "No artificial alternative exists for human blood. Every patient who needs a transfusion depends on a real donor like you." },
              { icon: MdLocalHospital, color: "orange", title: "Constant Demand", desc: "India needs over 14.6 million units of blood annually. Someone in India needs blood every 2 seconds." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${toneClasses[item.color].bg} rounded-full mb-4`}>
                  <item.icon className={`${toneClasses[item.color].text} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="public-section-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Eligibility Criteria</h2>
            <p className="public-section-subtitle">Check if you're eligible to donate today</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-green-100 dark:border-gray-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <MdCheckCircle className="text-green-500 text-2xl" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">You CAN Donate If...</h3>
              </div>
              <ul className="space-y-3">
                {eligibility.canDonate.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-red-100 dark:border-gray-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <MdWarning className="text-red-500 text-2xl" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">You CANNOT Donate If...</h3>
              </div>
              <ul className="space-y-3">
                {eligibility.cannotDonate.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <FaTimesCircle className="text-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
            * Always consult the medical staff at the donation center for final eligibility confirmation.
          </p>
        </div>
      </section>

      {/* Donation Process */}
      <section className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">The Donation Process</h2>
            <p className="public-section-subtitle">Simple, safe, and over before you know it</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {steps.map((item) => (
              <div key={item.step} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 text-center border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${toneClasses[item.color].bg} rounded-full mb-3`}>
                  <FaTint className={`${toneClasses[item.color].text} text-lg`} />
                </div>
                <p className={`text-2xl font-bold ${toneClasses[item.color].text} mb-1`}>{item.step}</p>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blood Type Compatibility */}
      <section className="public-section-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Blood Type Compatibility</h2>
            <p className="public-section-subtitle">Click on any blood type to see compatibility details</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-4 sm:p-5 mb-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {bloodTypes.map((bt) => (
              <button
                key={bt.type}
                onClick={() => setActiveType(activeType?.type === bt.type ? null : bt)}
                  className={`rounded-xl py-3 sm:py-4 font-bold text-base sm:text-lg transition-all border-2 ${
                  activeType?.type === bt.type
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-red-50/70 dark:bg-gray-900 text-red-600 dark:text-red-300 border-red-100 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50"
                }`}
              >
                {bt.type}
              </button>
            ))}
            </div>
          </div>

          {activeType && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-100 dark:border-gray-700 p-6 sm:p-8 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-3xl px-6 py-3 rounded-xl shadow">
                  {activeType.type}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Population with this type</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{activeType.frequency}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-semibold border border-red-100 dark:border-red-800/50">
                  Compatible Match Guide
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800/50">
                  <p className="text-green-700 dark:text-green-400 font-bold mb-3 flex items-center gap-2">
                    <FaCheckCircle /> Can Donate To
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {activeType.canDonateTo.map((t) => (
                      <span key={t} className="bg-white dark:bg-gray-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50">
                  <p className="text-blue-700 dark:text-blue-400 font-bold mb-3 flex items-center gap-2">
                    <MdBloodtype /> Can Receive From
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {activeType.canReceiveFrom.map((t) => (
                      <span key={t} className="bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!activeType && (
            <div className="text-center text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <FaQuestionCircle className="text-4xl mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a blood type above to see its compatibility details</p>
            </div>
          )}
        </div>
      </section>

      {/* Tips */}
      <section className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Before & After Donation Tips</h2>
            <p className="public-section-subtitle">Follow these tips for a comfortable donation experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">🌅 Before Donation</h3>
              <ul className="space-y-3">
                {[
                  "Drink at least 2–3 extra glasses of water",
                  "Eat a healthy, iron-rich meal",
                  "Get a good night's sleep",
                  "Avoid alcohol for 24 hours before",
                  "Wear comfortable, loose clothing",
                  "Bring a valid photo ID",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-orange-400 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">🌙 After Donation</h3>
              <ul className="space-y-3">
                {[
                  "Rest for 10–15 minutes at the center",
                  "Drink plenty of fluids throughout the day",
                  "Eat iron-rich foods like spinach, lentils, meat",
                  "Avoid heavy lifting or strenuous exercise for 24 hours",
                  "Keep the bandage on for at least 4 hours",
                  "Avoid smoking for 2 hours after donating",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="public-section-muted">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Frequently Asked Questions</h2>
            <p className="public-section-subtitle">Got questions? We've got answers.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQ
                key={faq.q}
                q={faq.q}
                a={faq.a}
                open={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="public-cta py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="public-cta-title text-3xl md:text-4xl mb-4">
            Ready to Save a Life Today?
          </h2>
          <p className="public-cta-subtitle mb-8 text-lg">
            Join thousands of donors and facilities already making a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              🩸 Register as Donor — It's Free!
            </Link>
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-transparent border border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              🏥 Register Your Facility
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Learn;