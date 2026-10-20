import type { NextPage } from "next";
import Layout from "../components/Layout";
import StuengTmarPoukFeature from "../components/StuengTmarPoukFeature";

const StuengTmarPoukPage: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <StuengTmarPoukFeature />
      </section>
    </Layout>
  );
};

export default StuengTmarPoukPage;
