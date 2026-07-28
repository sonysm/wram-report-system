import type { NextPage } from "next";
import Layout from "../components/Layout";
import ReportTable from "../components/ReportTable";

const Reports: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="mt-2 text-sm text-slate-600">
            Super admin can view all provinces, and province users can view only their own province.
          </p>
        </div>
        <ReportTable />
      </section>
    </Layout>
  );
};

export default Reports;
