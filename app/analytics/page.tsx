'use client';

import { useEffect, useState } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

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

    if (loading) return <div className="p-8">Loading analytics...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    // Calculate aggregated metrics
    const totalGames = stats.reduce((sum, s) => sum + (s.games_started || 0), 0);
    const totalWords = stats.reduce((sum, s) => sum + (s.words_confirmed || 0), 0);
    const totalScore = stats.reduce((sum, s) => sum + (s.total_score || 0), 0);
    const uniquePlayers = new Set(stats.map(s => s.user_id)).size;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">lilwordgame Analytics</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <MetricCard title="Total Games" value={totalGames} />
                <MetricCard title="Total Words" value={totalWords} />
                <MetricCard title="Total Score" value={totalScore} />
                <MetricCard title="Unique Players" value={uniquePlayers} />
            </div>

            {/* Daily Stats Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-semibold p-4 border-b">Daily Player Stats</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Games</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Words</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {stats
                            .sort((a, b) => b.stat_date.localeCompare(a.stat_date))
                            .map((stat, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{stat.user_id.slice(0, 8)}...</td>
                                    <td className="px-4 py-3 text-sm">{stat.stat_date}</td>
                                    <td className="px-4 py-3 text-sm">{stat.games_started || 0}</td>
                                    <td className="px-4 py-3 text-sm">{stat.words_confirmed || 0}</td>
                                    <td className="px-4 py-3 text-sm">{stat.total_score || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
    );
}