import type { NextPage } from "next";
import Layout from "../components/Layout";
import WaterwayFeature from "../components/WaterwayFeature";

const WaterwaysPage: NextPage = () => {
    return (
        <Layout>
            <section className="space-y-5">
                <WaterwayFeature />
            </section>
        </Layout>
    );
};

export default WaterwaysPage;
