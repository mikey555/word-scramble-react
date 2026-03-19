'use client';

import { useEffect, useState } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import "~/styles/globals.css";


const IDENTITY_POOL_ID = 'us-east-1:5ad039b8-b53e-4d91-9e17-23ef304f4146';
const REGION = 'us-east-1';
const TABLE_NAME = 'lilwordgame-player-stats';

interface PlayerStats {
    user_id: string;
    stat_date: string;
    games_started: number;
    words_confirmed: number;
    total_score: number;
    last_updated: string;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                const response = await docClient.send(
                    new ScanCommand({
                        TableName: TABLE_NAME,
                    })
                );

                setStats(response.Items as PlayerStats[]);
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    // Calculate aggregated metrics
    const totalGames = stats.reduce((sum, s) => sum + (s.games_started || 0), 0);
    const totalWords = stats.reduce((sum, s) => sum + (s.words_confirmed || 0), 0);
    const totalScore = stats.reduce((sum, s) => sum + (s.total_score || 0), 0);
    const uniquePlayers = new Set(stats.map(s => s.user_id)).size;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">lilwordgame Analytics Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Real-time player activity and engagement metrics
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Games"
                        value={totalGames}
                        subtitle="Games started"
                    />
                    <MetricCard
                        title="Words Played"
                        value={totalWords}
                        subtitle="Words confirmed"
                    />
                    <MetricCard
                        title="Total Score"
                        value={totalScore.toLocaleString()}
                        subtitle="Aggregate points"
                    />
                    <MetricCard
                        title="Active Players"
                        value={uniquePlayers}
                        subtitle="Unique users"
                    />
                </div>

                {/* Daily Stats Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Daily Activity</h2>
                        <p className="mt-1 text-sm text-gray-500">Player statistics by date</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Player ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Games
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Words
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Score
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No data available yet. Start playing to see stats!
                                    </td>
                                </tr>
                            ) : (
                                stats
                                    .sort((a, b) => b.stat_date.localeCompare(a.stat_date))
                                    .map((stat, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {stat.user_id.slice(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(stat.stat_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {stat.games_started || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {stat.words_confirmed || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {(stat.total_score || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

