import { Link } from "react-router-dom";
import { FaTint, FaHandHoldingHeart, FaUserPlus } from "react-icons/fa";
import { MdLocalHospital, MdBloodtype, MdPeople, MdVerified } from "react-icons/md";

const toneClasses = {
  red: { bg: "bg-red-100", text: "text-red-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

const Home = () => {
  return (
    <div className="public-page">

      {/* Hero Section */}
      <section className="public-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="public-hero-badge">
            <FaTint className="text-red-600" />
            India's Blood Donation Network
          </div>
          <h1 className="public-hero-title">
            Every Drop of Blood <br />
            <span className="text-yellow-300 drop-shadow-sm">Saves a Life</span>
          </h1>
          <p className="public-hero-subtitle">
            Connect with nearby blood banks, hospitals and donors.
            Real-time blood requests, camp registrations and inventory
            management — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm"
            >
              🩸 Become a Donor
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 bg-transparent border border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              🏥 Register Facility
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="public-section-muted">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: "1000+", label: "Donors Registered", color: "text-red-600" },
              { number: "50+", label: "Hospitals Connected", color: "text-orange-500" },
              { number: "20+", label: "Blood Banks", color: "text-blue-600" },
              { number: "5000+", label: "Lives Saved", color: "text-green-600" },
            ].map((stat) => (
              <div key={stat.label} className="public-card p-4 sm:p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <p className={`text-2xl sm:text-4xl font-bold ${stat.color}`}>{stat.number}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="public-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">What is BloodConnect?</h2>
            <p className="public-section-subtitle max-w-2xl mx-auto">
              BloodConnect is a smart blood donation management platform that
              connects donors, blood banks, and hospitals in real time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FaTint, color: "red", title: "For Donors", desc: "Find nearby blood banks, register for camps, and respond to emergency blood requests in your area." },
              { icon: MdLocalHospital, color: "orange", title: "For Hospitals", desc: "Post urgent blood requests and get connected with nearby blood banks and eligible donors instantly." },
              { icon: MdBloodtype, color: "blue", title: "For Blood Banks", desc: "Manage blood inventory, organize donation camps, and fulfill hospital requests efficiently." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${toneClasses[item.color].bg} rounded-full mb-4`}>
                  <item.icon className={`${toneClasses[item.color].text} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="public-section-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="public-section-title">How It Works</h2>
            <p className="public-section-subtitle">Simple steps to save a life</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Register", desc: "Create your account as a donor, hospital, or blood bank.", icon: FaUserPlus, color: "red" },
              { step: "02", title: "Get Verified", desc: "Admin verifies facilities. Donors are ready instantly.", icon: MdVerified, color: "blue" },
              { step: "03", title: "Connect", desc: "Hospitals post requests, blood banks respond, donors help.", icon: MdPeople, color: "orange" },
              { step: "04", title: "Save Lives", desc: "Blood reaches the patient in time. Lives are saved!", icon: FaHandHoldingHeart, color: "green" },
            ].map((item) => (
              <div key={item.step} className="public-card p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${toneClasses[item.color].bg} rounded-full mb-4`}>
                  <item.icon className={`${toneClasses[item.color].text} text-xl`} />
                </div>
                <p className={`text-3xl font-bold ${toneClasses[item.color].text} mb-2`}>{item.step}</p>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="public-cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="public-cta-title">
            Ready to Save a Life Today?
          </h2>
          <p className="public-cta-subtitle">
            Join thousands of donors and facilities already making a difference.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 sm:px-10 py-4 sm:py-5 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 hover:-translate-y-1 transition-all shadow-xl text-base sm:text-lg"
          >
            🩸 Register as Donor — It's Free!
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;