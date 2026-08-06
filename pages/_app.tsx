import type { AppProps } from "next/app";
import { Moul } from "next/font/google";
import "../styles/globals.css";

const moul = Moul({
    weight: "400",
    subsets: ["khmer"],
    variable: "--font-kh-moul",
    display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        <div className={moul.variable}>
            <Component {...pageProps} />
        </div>
    );
}