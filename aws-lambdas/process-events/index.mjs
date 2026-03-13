import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "lilwordgame-player-stats";

export const handler = async (event) => {
    console.log("Processing S3 event:", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing file: ${bucket}/${key}`);

        try {
            const getObjectParams = {
                Bucket: bucket,
                Key: key,
            };
            const response = await s3Client.send(new GetObjectCommand(getObjectParams));
            const eventData = JSON.parse(await response.Body.transformToString());

            console.log("Event data:", eventData);

            await processEvent(eventData);

        } catch (error) {
            console.error(`Error processing ${key}:`, error);
        }
    }

    return { statusCode: 200, body: "Processing complete" };
};

async function processEvent(eventData) {
    const { event_type, user_id, timestamp } = eventData;

    if (!user_id) {
        console.log("No user_id, skipping");
        return;
    }

    const date = timestamp.split('T')[0]; // YYYY-MM-DD

    const stats = await getPlayerStats(user_id, date);

    switch (event_type) {
        case 'GameStarted':
            stats.games_started = (stats.games_started || 0) + 1;
            break;
        case 'WordConfirmed':
            stats.words_confirmed = (stats.words_confirmed || 0) + 1;
            if (eventData.score) {
                stats.total_score = (stats.total_score || 0) + eventData.score;
            }
            break;
    }

    await updatePlayerStats(user_id, date, stats);
}

async function getPlayerStats(user_id, stat_date) {
    try {
        const response = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { user_id, stat_date }
        }));

        return response.Item || { user_id, stat_date };
    } catch (error) {
        console.error("Error getting stats:", error);
        return { user_id, stat_date };
    }
}

async function updatePlayerStats(user_id, stat_date, stats) {
    try {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { user_id, stat_date },
            UpdateExpression: "SET games_started = :gs, words_confirmed = :wc, total_score = :ts, last_updated = :lu",
            ExpressionAttributeValues: {
                ":gs": stats.games_started || 0,
                ":wc": stats.words_confirmed || 0,
                ":ts": stats.total_score || 0,
                ":lu": new Date().toISOString(),
            }
        }));

        console.log(`Updated stats for ${user_id} on ${stat_date}`);
    } catch (error) {
        console.error("Error updating stats:", error);
        throw error;
    }
}