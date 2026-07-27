import type { NextPage } from "next";
import Layout from "../components/Layout";
import ReportTable from "../components/ReportTable";

const Reports: NextPage = () => {
  return (
    <Layout>
      <h1>Reports</h1>
      <ReportTable />
    </Layout>
  );
};

export default Reports;
