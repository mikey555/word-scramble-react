import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" }); // change to your region

export const handler = async (event) => {
    console.log("Raw event:", JSON.stringify(event, null, 2));
    console.log("Event body:", event.body);

    // Parse incoming event data
    const eventData = JSON.parse(event.body);
    console.log("Parsed eventData:", eventData);

    // Add timestamp
    const timestamp = new Date().toISOString();
    const eventWithTimestamp = {
        ...eventData,
        timestamp,
    };

    // Create S3 key with date partition
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.json`;

    const s3Key = `events/${year}/${month}/${day}/${filename}`;

    // Write to S3
    const params = {
        Bucket: "lilwordgame-bucket",
        Key: s3Key,
        Body: JSON.stringify(eventWithTimestamp),
        ContentType: "application/json"
    };

    try {
        await s3Client.send(new PutObjectCommand(params));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // for CORS
            },
            body: JSON.stringify({ message: "Event recorded" })
        };
    } catch (error) {
        console.error("Error writing to S3:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to record event" })
        };
    }
};