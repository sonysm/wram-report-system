import type { NextPage } from "next";
import React, { useState } from "react";
import Layout from "../components/Layout";

const ContactPage: NextPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    category: "TECHNICAL_SUPPORT",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        province: "",
        category: "TECHNICAL_SUPPORT",
        subject: "",
        message: "",
      });
    }, 700);
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          <div className="max-w-2xl space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
              ជំនួយ និងទំនាក់ទំនង • Help & Support
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">ទាក់ទងមកយើងខ្ញុំ (Contact Us)</h1>
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed">
              សម្រាប់សំណួរ ការគាំទ្របច្ចេកទេស ការរាយការណ៍បញ្ហាប្រព័ន្ធ ឬការសាកសួរព័ត៌មានអំពីធនធានទឹក និងឧតុនិយម។
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact Cards */}
          <div className="space-y-5">
            {/* Headquarters Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">ទីស្តីការក្រសួង</h3>
                  <p className="text-[11px] text-slate-500">MOWRAM Headquarters</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">📍 អាសយដ្ឋាន៖</span>
                  <span>មហាវិថីព្រះមុនីវង្ស សង្កាត់បឹងកក់២ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">⏰ ម៉ោងធ្វើការ៖</span>
                  <span>ចន្ទ - សុក្រ (៧:៣០ ព្រឹក - ៥:០០ ល្ងាច)</span>
                </p>
              </div>
            </div>

            {/* Hotlines Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">ទូរស័ព្ទ & ប្រកាសអាសន្ន</h3>
                  <p className="text-[11px] text-slate-500">Emergency & Hotlines</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200">
                  <div className="font-bold text-[11px]">ខ្សែទូរស័ព្ទបន្ទាន់គ្រោះមហន្តរាយទឹកជំនន់៖</div>
                  <div className="text-sm font-mono font-black mt-0.5">115 / 023 724 289</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <div className="font-semibold text-[11px]">ការគាំទ្រប្រព័ន្ធបច្ចេកវិទ្យា (IT Helpdesk)៖</div>
                  <div className="text-xs font-mono mt-0.5">it-support@mowram.gov.kh</div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-xs text-cyan-900 dark:text-cyan-200 space-y-1">
              <span className="font-bold">💡 ចំណាំសម្រាប់មន្ទីរខេត្ត៖</span>
              <p className="text-[11px] leading-relaxed">
                លោកអ្នកអាចរាយការណ៍អំពីបញ្ហាកម្ពស់ទឹក ឬការខូចខាតប្រព័ន្ធតាមរយៈទំព័រ <span className="font-bold underline">របាយការណ៍ប្រចាំថ្ងៃ</span> ឬ <span className="font-bold underline">របាយការណ៍ទឹកជំនន់</span> បានដោយផ្ទាល់។
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                ផ្ញើសារ ឬសំណើមកកាន់ក្រុមការងារ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                សូមបំពេញទម្រង់ខាងក្រោម ក្រុមការងារយើងខ្ញុំនឹងឆ្លើយតបយ៉ាងឆាប់រហ័ស
              </p>
            </div>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-base text-emerald-800 dark:text-emerald-200">
                  សាររបស់អ្នកត្រូវបានផ្ញើដោយជោគជ័យ!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  អរគុណសម្រាប់ការទាក់ទងមកកាន់ក្រសួងធនធានទឹក និងឧតុនិយម។ ក្រុមការងារជំនាញនឹងត្រួតពិនិត្យ និងឆ្លើយតបជូនលោកអ្នក។
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                >
                  ផ្ញើសារផ្សេងទៀត
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ឈ្មោះពេញ * (Full Name)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. សុខ ចាន់ថា"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      រាជធានី-ខេត្ត (Province)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. បន្ទាយមានជ័យ ឬ កណ្តាល"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      លេខទូរស័ព្ទ (Phone Number)
                    </label>
                    <input
                      type="tel"
                      placeholder="012 345 678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      អ៊ីមែល (Email)
                    </label>
                    <input
                      type="email"
                      placeholder="example@mowram.gov.kh"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ប្រធានបទស្នើសុំ (Category)
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TECHNICAL_SUPPORT">ជំនួយបច្ចេកទេសប្រព័ន្ធ (IT Support)</option>
                      <option value="WATER_REPORT">រាយការណ៍ទិន្នន័យទឹក/ជំនន់ (Water Report Issue)</option>
                      <option value="SUBPROJECT_INQUIRY">សាកសួរអំពីសំណើអនុគម្រោង (Subproject Inquiry)</option>
                      <option value="FWUC_MANAGEMENT">សហគមន៍កសិករ FWUC (FWUC Support)</option>
                      <option value="GENERAL_FEEDBACK">សំណូមពរទូទៅ (General Feedback)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ចំណងជើងសង្ខេប * (Subject)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. បញ្ហាការបញ្ចូលរបាយការណ៍ប្រចាំថ្ងៃ..."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ខ្លឹមសារលម្អិត * (Message)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="សូមសរសេរខ្លឹមសារសំណួរ ឬបញ្ហាដែលលោកអ្នកបានជួបប្រទះនៅទីនេះ..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isSending ? "កំពុងផ្ញើសារ..." : "ផ្ញើសារឥឡូវនេះ (Send Message)"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;

