import { NextPage } from "next";
import Head from "next/head";
import Layout from "../../components/Layout";
import ProvinceDailyReport from "../../components/ProvinceDailyReport";

const ProvinceDailyReportPage: NextPage = () => {
    return (
        <Layout>
            <Head>
                <title>របាយការណ៍ប្រចាំថ្ងៃ - WRAM</title>
            </Head>
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">របាយការណ៍ប្រចាំថ្ងៃ</h1>
                        <p className="mt-1 text-slate-500">ព្រឹត្តិបត្រព័ត៌មាន និងការព្យាករណ៍អាកាសធាតុប្រចាំថ្ងៃ</p>
                    </div>
                </div>

                <ProvinceDailyReport />
            </section>
        </Layout>
    );
};

export default ProvinceDailyReportPage;
