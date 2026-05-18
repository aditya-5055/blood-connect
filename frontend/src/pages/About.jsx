
import { Link } from "react-router-dom";
import { FaTint, FaHeart, FaHandHoldingHeart, FaAward } from "react-icons/fa";
import { MdLocalHospital, MdBloodtype, MdPeople, MdVerified, MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

const toneClasses = {
  red: { bg: "bg-red-100", text: "text-red-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
};

const AboutUs = () => {
  const team = [
    {
      name: "Dr. Ananya Sharma",
      role: "Founder & Medical Director",
      bio: "Hematologist with 15+ years of experience in transfusion medicine.",
      initials: "AS",
      color: "red",
    },
    {
      name: "Rohan Mehta",
      role: "Co-Founder & CTO",
      bio: "Tech entrepreneur passionate about healthcare innovation and real-time systems.",
      initials: "RM",
      color: "orange",
    },
    {
      name: "Priya Nair",
      role: "Head of Partnerships",
      bio: "10+ years bridging hospitals and NGOs for impactful healthcare outcomes.",
      initials: "PN",
      color: "blue",
    },
    {
      name: "Karan Verma",
      role: "Community Manager",
      bio: "Drives donor engagement and manages India's largest blood donation volunteer network.",
      initials: "KV",
      color: "green",
    },
  ];

  const values = [
    {
      icon: FaHeart,
      color: "red",
      title: "Compassion First",
      desc: "Every decision we make is rooted in empathy — for patients in need, for selfless donors, and for the communities we serve.",
    },
    {
      icon: MdVerified,
      color: "blue",
      title: "Trust & Transparency",
      desc: "We verify every facility on our platform and maintain complete transparency in how blood requests are matched and fulfilled.",
    },
    {
      icon: FaHandHoldingHeart,
      color: "orange",
      title: "Community Driven",
      desc: "BloodConnect is built by and for India's communities. Every donor, hospital, and blood bank shapes our mission.",
    },
    {
      icon: FaAward,
      color: "green",
      title: "Excellence in Impact",
      desc: "We measure our success in lives saved — and we relentlessly improve our platform to save more, faster.",
    },
  ];

  const milestones = [
    { year: "2021", event: "BloodConnect founded in Bengaluru with 3 partner hospitals." },
    { year: "2022", event: "Expanded to 10 cities, onboarding 100+ blood banks across India." },
    { year: "2023", event: "Launched real-time emergency blood request system." },
    { year: "2024", event: "Crossed 1,000 registered donors and 5,000 lives saved." },
    { year: "2025", event: "Partnered with the Government of India on national blood shortage alerts." },
  ];

  return (
    <div className="public-page">

      {/* Hero Section */}
      <section className="public-hero py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="public-hero-badge">
            <FaTint className="text-red-600 dark:text-red-300" />
            Our Story
          </div>
          <h1 className="public-hero-title">
            About <span className="text-yellow-300">BloodConnect</span>
          </h1>
          <p className="public-hero-subtitle">
            We started with one simple belief — no one should lose their life
            waiting for blood. Today, we're India's fastest-growing blood
            donation network, connecting donors, hospitals, and blood banks in
            real time.
          </p>
          <Link
            to="/register"
              className="inline-block px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm"
          >
            🩸 Join Our Mission
          </Link>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-red-50 dark:bg-gray-800 border border-red-100 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-5">
                <FaTint className="text-red-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                To eliminate blood shortages across India by creating a
                seamless, technology-driven network that connects every donor
                with every patient who needs them — faster than ever before.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-5">
                <FaHandHoldingHeart className="text-orange-500 text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Our Vision</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                A future where no life is lost due to unavailability of blood —
                where every hospital has instant access to verified supply, and
                every willing donor's contribution is valued and celebrated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="public-section-muted py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="public-section-title mb-0">Our Impact So Far</h2>
            <p className="public-section-subtitle mt-2">Numbers that reflect the lives we've touched</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: "1000+", label: "Donors Registered", color: "text-red-600" },
              { number: "50+", label: "Hospitals Connected", color: "text-orange-500" },
              { number: "20+", label: "Blood Banks", color: "text-blue-600" },
              { number: "5000+", label: "Lives Saved", color: "text-green-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <p className={`text-2xl sm:text-4xl font-bold ${stat.color}`}>{stat.number}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">What We Stand For</h2>
            <p className="public-section-subtitle max-w-xl mx-auto">
              Our values guide every feature we build and every partnership we form.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="flex gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`flex-shrink-0 inline-flex items-center justify-center w-14 h-14 ${toneClasses[v.color].bg} rounded-full`}>
                  <v.icon className={`${toneClasses[v.color].text} text-2xl`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">{v.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey / Timeline */}
      <section className="public-section-muted">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Our Journey</h2>
            <p className="public-section-subtitle">From a small startup to India's blood donation backbone</p>
          </div>
          <div className="relative border-l-4 border-red-200 pl-6 sm:pl-8 space-y-8 ml-2 sm:ml-0">
            {milestones.map((m, i) => (
              <div key={m.year} className="relative">
                <div className="absolute -left-[2.85rem] top-1 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow" />
                <p className="text-red-600 font-bold text-sm mb-1">{m.year}</p>
                <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl shadow px-5 py-4 text-sm border border-gray-100 dark:border-gray-800">
                  {m.event}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Who We Serve */}
      <section className="public-section-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">Who We Serve</h2>
            <p className="public-section-subtitle">BloodConnect is built for everyone in the blood supply chain</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FaTint, color: "red", title: "For Donors", desc: "Find nearby blood banks, register for camps, and respond to emergency blood requests in your area." },
              { icon: MdLocalHospital, color: "orange", title: "For Hospitals", desc: "Post urgent blood requests and get connected with nearby blood banks and eligible donors instantly." },
              { icon: MdBloodtype, color: "blue", title: "For Blood Banks", desc: "Manage blood inventory, organize donation camps, and fulfill hospital requests efficiently." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${toneClasses[item.color].bg} rounded-full mb-4`}>
                  <item.icon className={`${toneClasses[item.color].text} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Strip */}
      <section className="py-14 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">We'd love to hear from you — donors, facilities, or partners.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: MdEmail, label: "Email Us", value: "hello@bloodconnect.in", color: "red" },
              { icon: MdPhone, label: "Call Us", value: "+91 98765 43210", color: "orange" },
              { icon: MdLocationOn, label: "Head Office", value: "Maharashtra, Pune", color: "blue" },
            ].map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-2">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${toneClasses[c.color].bg} rounded-full`}>
                  <c.icon className={`${toneClasses[c.color].text} text-xl`} />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{c.label}</p>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm sm:text-base"
            >
              🩸 Register as Donor — It's Free!
            </Link>
            <Link
              to="/register"
              className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-transparent border border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm sm:text-base"
            >
              🏥 Register Your Facility
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;