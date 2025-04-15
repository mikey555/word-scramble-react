// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, type DocumentContext } from 'next/document';
import {VERCEL_URL} from "~/components/Constants.tsx";

class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    render() {
        return (
            <Html lang="en">
                <Head>

                    <meta name="description" content="Compete with up to 4 players to find the longest word"></meta>
                    <link rel="icon" href="/favicon.ico"/>
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
                    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
                    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
                    <link rel="manifest" href="/site.webmanifest"/>

                    <meta property="og:title" content="lil word game - multiplayer word search"/>
                    <meta property="og:description" content="Compete with up to 4 players to find the longest word"/>
                    <meta property="og:type" content="website"/>
                    <meta property="og:url" content="https://www.lilwordgame.com/"/>
                    <meta property="og:image" content={'https://' + VERCEL_URL + '/board.png'}/>
                    <meta property="og:image:width" content="284"/>
                    <meta property="og:image:height" content="284"/>
                </Head>
                <body>
                <Main/>
                <NextScript/>
                </body>
            </Html>
        );
    }
}

export default MyDocument;