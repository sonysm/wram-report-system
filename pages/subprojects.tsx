import type { NextPage } from "next";
import Layout from "../components/Layout";
import SubprojectPlanFeature from "../components/SubprojectPlanFeature";

const SubprojectsPage: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <SubprojectPlanFeature />
      </section>
    </Layout>
  );
};

export default SubprojectsPage;

