import type { NextPage } from "next";
import Layout from "../components/Layout";
import ReportTable from "../components/ReportTable";
import DataForm from "../components/DataForm";

const Reports: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">របាយការណ៏ទិន្ន័យផលប៉ះពាល់</h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit new entries and view the consolidated report.
          </p>
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.55)] sm:p-10">
          <h2 className="text-xl font-semibold text-slate-900">បញ្ចូលទិន្នន័យ</h2>
          <p className="mt-2 text-sm text-slate-600">Select a district in your province, or add one if missing.</p>
          <div className="mt-6">
            <DataForm />
          </div>
        </article>

        <ReportTable />
      </section>
    </Layout>
  );
};

export default Reports;
