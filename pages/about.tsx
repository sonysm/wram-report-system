import type { NextPage } from "next";
import Link from "next/link";
import Layout from "../components/Layout";

const AboutPage: NextPage = () => {
  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-60 h-60 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20">
              <span>ក្រសួងធនធានទឹក និងឧតុនិយម • MOWRAM</span>
              <span>•</span>
              <span>កំណែ 2.5 (Version 2.5)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              ប្រព័ន្ធគ្រប់គ្រង និងរាយការណ៍ធនធានទឹកកម្ពុជា
            </h1>
            <h2 className="text-base sm:text-lg text-cyan-100 font-medium max-w-2xl">
              Water Resources & Agrometeorology Management Platform (WRAM)
            </h2>

            <p className="text-sm text-cyan-50/90 max-w-3xl leading-relaxed pt-2">
              ប្រព័ន្ធព័ត៌មានវិទ្យារួមសម្រាប់ការប្រមូលទិន្នន័យ តាមដាន វិភាគ និងរាយការណ៍អំពីធនធានទឹក អាងស្ដុកទឹក ស្ថានីយជលសាស្ត្រ-ឧតុនិយម ការជូនដំណឹងទឹកជំនន់ និងផែនការស្រាវជ្រាវអនុគម្រោងធារាសាស្ត្រទូទាំង ២៥ រាជធានី-ខេត្ត នៃព្រះរាជាណាចក្រកម្ពុជា។
            </p>
          </div>
        </div>

        {/* Vision & Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.25c-5.25 7.5-6.75 10.5-6.75 13.5a6.75 6.75 0 0 0 13.5 0c0-3-1.5-6-6.75-13.5Z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">សន្តិសុខទឹក និងធារាសាស្ត្រ</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ធានាការគ្រប់គ្រងតុល្យភាពទឹក តាមដានចំណុះស្តុកទឹកក្នុងអាង និងការផ្គត់ផ្គង់ទឹកស្រោចស្រពសម្រាប់កសិកម្មទាំងរដូវវស្សា និងរដូវប្រាំងប្រកបដោយចីរភាព។
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ប្រព័ន្ធប្រកាសអាសន្នជាមុន</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ផ្តល់ដំណឹងទាន់ពេលវេលាអំពីកម្ពស់ទឹកជំនន់ ទឹកភ្លៀងធ្លាក់ខ្លាំង និងការប៉ះពាល់ ដើម្បីការពារអាយុជីវិត ទ្រព្យសម្បត្តិ និងដំណាំស្រែចម្ការរបស់ប្រជាពលរដ្ឋ។
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ផែនការស្រាវជ្រាវអនុគម្រោង</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              រៀបចំសំណើអនុគម្រោងស្រាវជ្រាវ និងទំនើបកម្មប្រព័ន្ធធារាសាស្ត្រ (Concept Notes Proforma ១០ ជំពូក) សម្រាប់បណ្តាខេត្តទូទាំងប្រទេស។
            </p>
          </div>
        </div>

        {/* Modules Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              សមាសភាគស្នូលនៃប្រព័ន្ធ (Core System Modules)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              មុខងារសំខាន់ៗដែលត្រូវបានរៀបចំឡើងស្របតាមតម្រូវការបច្ចេកទេសរបស់ក្រសួង
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">១. អាងស្តុកទឹក និងប្រភពទឹក</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                តាមដានបរិមាណទឹកជាក់ស្តែង ភាគរយទឹក និងសមត្ថភាពផ្គត់ផ្គង់ទឹកស្រោចស្រពតាមអាងនីមួយៗក្នុងខេត្ត។
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">២. ទន្លេ ស្ទឹង ព្រែក អូរ</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                កត់ត្រាបណ្តាញជលសាស្ត្រ ប្រវែង ទទឹង រយៈកម្ពស់ និងកូអរដោនេខាងលើទឹក និងខាងក្រោមទឹក។
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">៣. ផែនការអនុគម្រោងស្រាវជ្រាវ (Concept Note)</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                ទម្រង់ផ្លូវការ ១០ ជំពូក សម្រាប់បញ្ចូល និងវាយតម្លៃសំណើគម្រោងអភិវឌ្ឍន៍ធារាសាស្ត្រតាមខេត្ត។
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">៤. សហគមន៍កសិករប្រើប្រាស់ទឹក (FWUC)</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                គ្រប់គ្រងព័ត៌មានចុះបញ្ជីសហគមន៍ ផ្ទៃដីស្រោចស្រព និងការគ្រប់គ្រងថែទាំ O&M របស់កសិករ។
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">៥. ស្ថានីយជលសាស្ត្រ & ឧតុនិយម</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                តាមដានបណ្តាញស្ថានីយកម្ពស់ទឹក ស្ថានីយឧតុនិយមស្វ័យប្រវត្តិនឹងកម្រិតប្រកាសអាសន្ន។
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">៦. របាយការណ៍ផលប៉ះពាល់ទឹកជំនន់</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                កត់ត្រាទិន្នន័យគ្រួសាររងគ្រោះ ការខូចខាតដំណាំស្រូវ សត្វពាហនៈ និងហេដ្ឋារចនាសម្ព័ន្ធ។
              </p>
            </div>
          </div>
        </div>

        {/* Organization & Technical Info */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">ក្រសួងធនធានទឹក និងឧតុនិយម (MOWRAM)</p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              © {new Date().getFullYear()} រក្សាសិទ្ធិគ្រប់យ៉ាងដោយក្រសួងធនធានទឹក និងឧតុនិយម
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-xs"
            >
              ទាក់ទងមកយើងខ្ញុំ (Contact Us)
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

