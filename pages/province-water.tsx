import type { NextPage } from "next";
import Layout from "../components/Layout";
import ProvinceWaterFeature from "../components/ProvinceWaterFeature";

const ProvinceWaterPage: NextPage = () => {
    return (
        <Layout>
            <section className="space-y-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Province Water Feature</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Separate feature for province users to record basin water data and print report-style output.
                    </p>
                </div>
                <ProvinceWaterFeature />
            </section>
        </Layout>
    );
};

export default ProvinceWaterPage;
