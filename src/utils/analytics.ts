const EVENTS_API = 'https://4te6vhmwid.execute-api.us-east-1.amazonaws.com/prod/events';

export enum AnalyticsEventType {
    GameStarted = "GameStarted",
    WordConfirmed = "WordConfirmed",
    RoundEnded = "RoundEnded",

}

export async function trackEvent(eventType: AnalyticsEventType, data: Record<string, any>) {
    try {
        await fetch(EVENTS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: eventType,
                ...data,
            }),
        });
    } catch (error) {
        console.error('Analytics error:', error);
    }
}