'use client';

import { useEffect, useState } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { cn } from '~/lib/utils';
import {lexend} from "~/components/Layout.tsx";
import React from "react";
import "~/styles/globals.css";

const IDENTITY_POOL_ID = 'us-east-1:5ad039b8-b53e-4d91-9e17-23ef304f4146';
const REGION = 'us-east-1';
const PLAYER_STATS_TABLE = 'lilwordgame-player-stats';
const GAME_STATS_TABLE = 'lilwordgame-game-stats';

interface PlayerStats {
    user_id: string;
    stat_date: string;
    games_started: number;
    words_confirmed: number;
    total_score: number;
    last_updated: string;
}

interface ScoredWords {
    word: string;
    score: number;
}

interface GameStats {
    game_id: string;
    scored_words: ScoredWords[];
    game_started_at: string;
    stat_date: string;
}

export default function AnalyticsPage() {
    const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
    const [gameStats, setGameStats] = useState<GameStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedGame, setExpandedGame] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const client = new DynamoDBClient({
                    region: REGION,
                    credentials: fromCognitoIdentityPool({
                        clientConfig: { region: REGION },
                        identityPoolId: IDENTITY_POOL_ID,
                    }),
                });

                const docClient = DynamoDBDocumentClient.from(client);

                // Fetch player stats
                const playerResponse = await docClient.send(
                    new ScanCommand({
                        TableName: PLAYER_STATS_TABLE,
                    })
                );

                // Fetch game stats
                const gameResponse = await docClient.send(
                    new ScanCommand({
                        TableName: GAME_STATS_TABLE,
                    })
                );

                setPlayerStats(playerResponse.Items as PlayerStats[]);
                setGameStats(gameResponse.Items as GameStats[]);
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        }

        void fetchStats();
    }, []);

    if (loading) {
        return (
            <div className={cn("bg-gray-50 min-h-svh flex items-center justify-center touch-none text-base text-center", lexend.className)}>
                <div className="text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("bg-gray-50 min-h-svh flex items-center justify-center touch-none text-base text-center", lexend.className)}>
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    // Calculate aggregated metrics
    const totalGames = gameStats.length;
    const totalWords = gameStats.reduce((sum, g) => sum + (g.scored_words?.length || 0), 0);
    const uniquePlayers = new Set(playerStats.map(s => s.user_id)).size;
    const avgWordsPerGame = totalGames > 0 ? Math.round(totalWords / totalGames) : 0;

    // Calculate top 5 highest scoring words
    const allWords = gameStats.flatMap(game =>
        (game.scored_words || []).map(w => ({ ...w, game_id: game.game_id }))
    );
    const topWords = allWords
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // Calculate top 5 highest scoring games
    const gamesWithScores = gameStats.map(game => ({
        ...game,
        total_score: (game.scored_words || []).reduce((sum, w) => sum + w.score, 0)
    }));
    const topGames = gamesWithScores
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 5);

    // Get 10 most recent games
    const recentGames = [...gameStats]
        .sort((a, b) => new Date(b.stat_date).getTime() - new Date(a.stat_date).getTime())
        .slice(0, 10);

    // Format date/time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = String(date.getFullYear()).slice(-2);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${month}/${day}/${year} ${hours}:${minutes}${ampm}`;
    };

    return (
        <div className={cn("bg-gray-50 min-h-svh flex items-center justify-center touch-none text-base text-center", lexend.className)}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                {/* Header */}
                <div className="mb-8 text-left">
                    <h1 className="text-3xl font-semibold text-gray-900">Analytics Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Real-time player activity and engagement metrics
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Games"
                        value={totalGames}
                        subtitle="Games completed"
                    />
                    <MetricCard
                        title="Words Played"
                        value={totalWords}
                        subtitle="Total words confirmed"
                    />
                    <MetricCard
                        title="Avg Words/Game"
                        value={avgWordsPerGame}
                        subtitle="Average per game"
                    />
                    <MetricCard
                        title="Unique Users"
                        value={uniquePlayers}
                        subtitle="Active players"
                    />
                </div>

                {/* Top Words and Top Games */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top 5 Highest Scoring Words */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-left">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Top Scoring Words</h2>
                            <p className="mt-1 text-sm text-gray-500">Highest individual word scores</p>
                        </div>
                        <div className="px-6 py-4">
                            {topWords.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No words played yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {topWords.map((wordData, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg font-semibold text-gray-400 w-6">#{idx + 1}</span>
                                                <span className="text-base font-medium text-gray-900">{wordData.word}</span>
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900">{wordData.score}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top 5 Highest Scoring Games */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-left">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Top Scoring Games</h2>
                            <p className="mt-1 text-sm text-gray-500">Highest single game scores</p>
                        </div>
                        <div className="px-6 py-4">
                            {topGames.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No completed games yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {topGames.map((game, idx) => (
                                        <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-lg font-semibold text-gray-400 w-6">#{idx + 1}</span>
                                                    <span className="text-sm text-gray-600">
                            {game.game_id.slice(0, 8)}...
                          </span>
                                                </div>
                                                <span className="text-lg font-semibold text-gray-900">{game.total_score}</span>
                                            </div>
                                            <div className="ml-9 text-xs text-gray-500">
                                                {game.scored_words?.length || 0} words played
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Games Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-left">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Recent Games</h2>
                        <p className="mt-1 text-sm text-gray-500">10 most recently completed games</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Date & Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Words
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Score
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">

                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {recentGames.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No games played yet. Start playing to see stats!
                                    </td>
                                </tr>
                            ) : (
                                recentGames.map((game) => {
                                    const totalScore = (game.scored_words || []).reduce((sum, w) => sum + w.score, 0);
                                    const isExpanded = expandedGame === game.game_id;

                                    return (
                                        <React.Fragment key={game.game_id}>
                                            <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedGame(isExpanded ? null : game.game_id)}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDateTime(game.stat_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {game.scored_words?.length || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {totalScore}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {isExpanded ? '▼' : '▶'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 bg-gray-50">
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full text-sm">
                                                                <thead>
                                                                <tr className="border-b border-gray-300">
                                                                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600">Word</th>
                                                                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-600">Score</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {(game.scored_words || []).map((word, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-200 last:border-0">
                                                                        <td className="py-2 px-3 text-gray-900">{word.word}</td>
                                                                        <td className="py-2 px-3 text-right font-medium text-gray-900">{word.score}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="font-semibold border-t-2 border-gray-300">
                                                                    <td className="py-2 px-3 text-gray-900">Total</td>
                                                                    <td className="py-2 px-3 text-right text-gray-900">{totalScore}</td>
                                                                </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
                        title,
                        value,
                        subtitle
                    }: {
    title: string;
    value: number | string;
    subtitle: string;
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}