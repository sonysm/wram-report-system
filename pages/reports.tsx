import type { NextPage } from "next";
import { useState } from "react";
import Layout from "../components/Layout";
import ReportTable from "../components/ReportTable";
import DataForm from "../components/DataForm";

const Reports: NextPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntrySaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Layout>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">របាយការណ៍ទិន្ន័យផលប៉ះពាល់</h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit new entries and view the consolidated report.
          </p>
        </div>

        <DataForm onEntrySaved={handleEntrySaved} />

        <ReportTable refreshTrigger={refreshTrigger} />
      </section>
    </Layout>
  );
};

export default Reports;
