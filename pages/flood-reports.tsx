import type { NextPage } from "next";
import Layout from "../components/Layout";
import FloodReportFeature from "../components/FloodReportFeature";

const FloodReportPage: NextPage = () => {
    return (
        <Layout>
            <section className="space-y-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Provincial flood report / របាយការណ៍ទឹកជំនន់</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        កត់ត្រាព័ត៌មានទឹកជំនន់ប្រចាំខេត្ត
                    </p>
                </div>
                <FloodReportFeature />
            </section>
        </Layout>
    );
};

export default FloodReportPage;
