import type { NextPage } from "next";
import Layout from "../components/Layout";
import StaffManagementFeature from "../components/StaffManagementFeature";

const StaffStructurePage: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <StaffManagementFeature />
      </section>
    </Layout>
  );
};

export default StaffStructurePage;
