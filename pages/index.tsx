import type { NextPage } from "next";
import Layout from "../components/Layout";
import DataForm from "../components/DataForm";

const Home: NextPage = () => {
  return (
    <Layout>
      <h1>WRAM Report System</h1>
      <p>Enter data for your department below.</p>
      <DataForm departmentId={1} />
    </Layout>
  );
};

export default Home;
