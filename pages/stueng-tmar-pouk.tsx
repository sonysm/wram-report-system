import type { NextPage } from "next";
import Layout from "../components/Layout";
import SubprojectPlanFeature from "../components/SubprojectPlanFeature";

const StuengTmarPoukPage: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <SubprojectPlanFeature />
      </section>
    </Layout>
  );
};

export default StuengTmarPoukPage;
