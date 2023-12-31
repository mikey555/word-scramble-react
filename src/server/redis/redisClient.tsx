
import { createClient } from 'redis';
import { kv } from '@vercel/kv';
import { BoggleRedisType } from './api';


// use process.env here - TODO: why is env.mjs not accessible here?
export function getRedisClient() {
    let client: BoggleRedisType;
    // if (process.env.VERCEL_ENV === 'development') {
    if (process.env.USE_LOCAL_REDIS === 'true') {
        client = createClient();
        client.on('error', err => console.log('Redis Client Error', err));
        void client.connect(); // TODO: originally awaited. is there an issue with redis requests made before connection?
        return client;
    }
    return kv;
}

