import { NextPage } from "next";
import Link from "next/link";
import Layout from "../components/Layout";

const StaffStructurePage: NextPage = () => {
  const plannedFeatures = [
    {
      title: "រចនាសម្ព័ន្ធឋានានុក្រម (Hierarchy Tree)",
      desc: "គំនូសតាងរចនាសម្ព័ន្ធមន្ទីរធនធានទឹក និងឧតុនិយម ការិយាល័យជំនាញ និងផ្នែកបច្ចេកទេសចំណុះ",
      icon: (
        <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      title: "បញ្ជីវត្តមាន និងព័ត៌មានមន្ត្រី (Staff Directory)",
      desc: "គ្រប់គ្រងប្រវត្តិរូប តួនាទី ភារកិច្ច និងលេខទំនាក់ទំនងមន្ត្រីរាជការ តាមការិយាល័យ និងស្រុក",
      icon: (
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
    },
    {
      title: "ការបែងចែកកិច្ចការ និងតំបន់ទទួលខុសត្រូវ (Jurisdiction)",
      desc: "ចាត់តាំងមន្ត្រីជំនាញទទួលបន្ទុកតាមប្រព័ន្ធធារាសាស្ត្រ អាងទឹក និងស្ថានីយជលសាស្ត្រនីមួយៗ",
      icon: (
        <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
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
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">រចនាសម្ព័ន្ធមន្រ្តី បុគ្គលិក</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              រចនាសម្ព័ន្ធមន្រ្តី បុគ្គលិក (Staff Structure)
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              ប្រព័ន្ធគ្រប់គ្រងរចនាសម្ព័ន្ធអង្គភាព ឋានានុក្រម និងបញ្ជីមន្ត្រីរាជការ នៃមន្ទីរធនធានទឹក និងឧតុនិយម
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
        <div className="relative overflow-hidden rounded-3xl border border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 p-8 sm:p-12 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300 dark:border-cyan-700 bg-cyan-100/70 dark:bg-cyan-950 px-4 py-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>មុខងារកំពុងរៀបចំអភិវឌ្ឍន៍ • Coming Soon</span>
          </div>

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 mb-6">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
            មុខងារ «រចនាសម្ព័ន្ធមន្រ្តី បុគ្គលិក» នឹងដាក់ឱ្យដំណើរការឆាប់ៗនេះ
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            ក្រុមការងារបច្ចេកវិទ្យាកំពុងរៀបចំ និងផ្គុំទិន្នន័យដើម្បីសម្រួលដល់ការគ្រប់គ្រងមន្ត្រីរាជការ បុគ្គលិកកិច្ចសន្យា 
            និងការិយាល័យជំនាញនៃមន្ទីរធនធានទឹក និងឧតុនិយមរាជធានី-ខេត្តទាំង ២៥។
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-6 py-2.5 shadow-sm transition"
            >
              ទំព័រដើម (Dashboard)
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              ទាក់ទងក្រុមបច្ចេកទេស
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

export default StaffStructurePage;

