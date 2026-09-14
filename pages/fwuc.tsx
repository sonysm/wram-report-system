import type { NextPage } from "next";
import Layout from "../components/Layout";
import FwucFeature from "../components/FwucFeature";

const FwucPage: NextPage = () => {
  return (
    <Layout>
      <section className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">របាយការណ៍ សកបទ (FWUC)</h1>
          <p className="mt-2 text-sm text-slate-600">
            បញ្ជីឈ្មោះសហគមន៍កសិករប្រើប្រាស់ទឹក (សកបទ) និងព័ត៌មានលម្អិត។
          </p>
        </div>
        <FwucFeature />
      </section>
    </Layout>
  );
};

export default FwucPage;
