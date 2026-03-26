import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PLAYER_STATS_TABLE = "lilwordgame-player-stats";
const GAME_STATS_TABLE = "lilwordgame-game-stats";

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
    const { event_type } = eventData;

    // Route to appropriate processor based on event type
    switch (event_type) {
        case 'GameStarted':
            await processPlayerEvent(eventData);
            break;
        case 'WordConfirmed':
            await processPlayerEvent(eventData);
            break;
        case 'GameEnded':
            await processGameEvent(eventData);
            break;
        default:
            console.log(`Unknown event type: ${event_type}`);
    }
}

// Process events that update player stats (aggregated by user_id + date)
async function processPlayerEvent(eventData) {
    const { event_type, user_id, stat_date } = eventData;

    if (!user_id) {
        console.log("No user_id, skipping player event");
        return;
    }

    const date = stat_date.split('T')[0]; // YYYY-MM-DD

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

// Process events that create game records (stored by game_id)
async function processGameEvent(eventData) {
    const { game_id, stat_date } = eventData;

    if (!game_id) {
        console.log("No game_id, skipping game event");
        return;
    }

    const gameStats = {
        game_id,
        stat_date,
        scored_words: eventData.scored_words,
        game_started_at: eventData.game_started_at,
    };

    await saveGameStats(gameStats);
}

async function getPlayerStats(user_id, stat_date) {
    try {
        const response = await docClient.send(new GetCommand({
            TableName: PLAYER_STATS_TABLE,
            Key: { user_id, stat_date }
        }));

        return response.Item || { user_id, stat_date };
    } catch (error) {
        console.error("Error getting player stats:", error);
        return { user_id, stat_date };
    }
}

async function updatePlayerStats(user_id, stat_date, stats) {
    try {
        await docClient.send(new UpdateCommand({
            TableName: PLAYER_STATS_TABLE,
            Key: { user_id, stat_date },
            UpdateExpression: "SET games_started = :gs, words_confirmed = :wc, total_score = :ts, last_updated = :lu",
            ExpressionAttributeValues: {
                ":gs": stats.games_started || 0,
                ":wc": stats.words_confirmed || 0,
                ":ts": stats.total_score || 0,
                ":lu": new Date().toISOString(),
            }
        }));

        console.log(`Updated player stats for ${user_id} on ${stat_date}`);
    } catch (error) {
        console.error("Error updating player stats:", error);
        throw error;
    }
}

async function saveGameStats(gameStats) {
    try {
        await docClient.send(new PutCommand({
            TableName: GAME_STATS_TABLE,
            Item: gameStats
        }));

        console.log(`Saved game stats for game ${gameStats.game_id}`);
    } catch (error) {
        console.error("Error saving game stats:", error);
        throw error;
    }
}