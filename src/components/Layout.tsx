import { Analytics } from "@vercel/analytics/react"
import Head from "next/head"
import { type ReactNode } from "react"
import { cn } from "~/lib/utils"
import { SpeedInsights } from "@vercel/speed-insights/next"
import {Lexend} from "next/font/google";

interface LayoutProps {
    children: ReactNode
}

export const lexend = Lexend({
    subsets: ["latin"],
    variable: "--font-sans",
})

export default function Layout({ children }: LayoutProps) {
    return (
        <>
            <SpeedInsights/>
            <Head>
                <title>lil word game - multiplayer word search</title>
                <meta name="viewport" content="initial-scale=1, width=device-width"/>
            </Head>
            <main
                className={cn("bg-gray-100 min-h-svh flex items-center justify-center touch-none text-base text-center", lexend.className)}>
                    {children}
                    <Analytics />
            </main>

        </>

    )
}