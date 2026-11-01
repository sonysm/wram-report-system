import { NextPage } from "next";
import Link from "next/link";
import Layout from "../components/Layout";

const IrrigationSystemsPage: NextPage = () => {
  const plannedFeatures = [
    {
      title: "សារពើភ័ណ្ឌប្រព័ន្ធធារាសាស្ត្រ (Scheme Inventory)",
      desc: "ទិន្នន័យលម្អិតនៃប្រព័ន្ធធារាសាស្ត្រខ្នាតធំ មធ្យម និងតូច ទូទាំងប្រទេស ជាមួយកូដសម្គាល់ និងភូមិសាស្ត្រ",
      icon: (
        <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />
        </svg>
      ),
    },
    {
      title: "ផ្ទៃដីស្រោចស្រព និងលទ្ធភាពផ្គត់ផ្គង់ (Command Area)",
      desc: "គណនានិងតាមដានផ្ទៃដីស្រោចស្រពជាក់ស្តែង រដូវវស្សា និងរដូវប្រាំង ព្រមទាំងសមត្ថភាពស្តុកទឹក",
      icon: (
        <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      ),
    },
    {
      title: "ស្ថានភាពសំណង់សិល្បការ្យ (Hydraulic Structures)",
      desc: "តាមដានសុវត្ថិភាពទ្វារទឹក មេប្រឡាយ ប្រឡាយរង និងស្ថានីយបូមទឹក ព្រមទាំងផែនការជួសជុលថែទាំ",
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.67 2.67 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 0 0 4.486-6.32l-3.276 3.277a3.003 3.003 0 0 1-4.243-4.243l3.276-3.277a4.5 4.5 0 0 0-6.32 4.486c.118.58.094 1.193-.07 1.743" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400">ទំព័រដើម</Link>
              <span>/</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">ប្រព័ន្ធធារាសាស្រ្ត</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              ប្រព័ន្ធធារាសាស្រ្ត (Irrigation Systems)
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              ប្រព័ន្ធព័ត៌មានភូមិសាស្ត្រ និងទិន្នន័យគ្រប់គ្រងប្រព័ន្ធធារាសាស្ត្រ សំណង់ក្បាលហុង និងបណ្តាញប្រឡាយមេ-រង
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>ត្រឡប់ទៅទំព័រដើម</span>
          </Link>
        </div>

        {/* Coming Soon Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-200 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 p-8 sm:p-12 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300 dark:border-teal-700 bg-teal-100/70 dark:bg-teal-950 px-4 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>មុខងារកំពុងរៀបចំអភិវឌ្ឍន៍ • Coming Soon</span>
          </div>

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/30 mb-6">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
            មុខងារ «ប្រព័ន្ធធារាសាស្រ្ត» នឹងដាក់ឱ្យដំណើរការឆាប់ៗនេះ
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            ប្រព័ន្ធកំពុងតភ្ជាប់ទិន្នន័យ GIS និងសារពើភ័ណ្ឌប្រព័ន្ធធារាសាស្ត្រទូទាំងប្រទេស ដើម្បីផ្តល់ព័ត៌មានអំពីប្រភពទឹក 
            លទ្ធភាពស្រោចស្រព ផែនទីបណ្តាញប្រឡាយ និងការវាយតម្លៃប្រសិទ្ធភាពប្រើប្រាស់ទឹកកសិកម្ម។
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-2.5 shadow-sm transition"
            >
              ទំព័រដើម (Dashboard)
            </Link>
            <Link
              href="/fwuc"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              សហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ)
            </Link>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            លក្ខណៈពិសេសដែលគ្រោងនឹងដាក់បញ្ចូល (Planned Capabilities)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plannedFeatures.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs hover:shadow-md transition"
              >
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit mb-4">
                  {f.icon}
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                  {f.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IrrigationSystemsPage;

