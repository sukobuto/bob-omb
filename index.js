const { SocketModeClient, LogLevel } = require('@slack/socket-mode');
const { WebClient } = require('@slack/web-api');

const appToken = process.env.APP_TOKEN;
const botToken = process.env.BOT_TOKEN;

const skt = new SocketModeClient({
    logLevel: LogLevel.INFO,
    appToken,
})
const web = new WebClient(botToken, {});

skt.on('connected', async (params) => {
    console.log({
        event: 'connected',
        params
    });
})

skt.on('ready', async (params) => {
    console.log({
        event: 'ready',
        params
    });
})

skt.on('hello', async (params) => {
    console.log({
        event: 'hello',
        params
    });
})

skt.on('app_mention', async ({ event, body, ack }) => {
    console.log({
        event,
        body,
    })
    try {
        await ack();
        await web.chat.postMessage({ channel: event.channel, text: 'あっ' });
    } catch (e) {
        console.error(e)
    }
});

const sirenChannels = {};

skt.on('message', async({ event, body, ack }) => {
    if (event.bot_profile && event.bot_profile.name === 'ボムへい') {
        console.log('this is self message.')
        return;
    }
    if (event.subtype === 'message_deleted') {
        return;
    }
    console.log({ event, body })
    try {
        await ack();
        if (event.subtype === 'bot_message') {
            await alertLoop(event.channel)
        } else {
            if (sirenChannels[event.channel]) {
                await web.chat.postMessage({ channel: event.channel, text: 'よろしくおねがいします' })
                sirenChannels[event.channel] = false
            }
        }
    } catch (e) {
        console.error(e)
    }
});

async function sleep(ms) {
    await new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
    })
}

async function alertLoop(channel) {
    sirenChannels[channel] = true
    let lastSent;
    await sleep(20 * 1000)
    let count = 1;
    while (sirenChannels[channel]) {
        if (lastSent) {
            await web.chat.delete({
                channel: channel,
                ts: lastSent.ts,
            })
        }
        if (!sirenChannels[channel]) return;
        lastSent = await web.chat.postMessage({ channel: channel, text: 'アラートを確認してください' + '!'.repeat(count) })
        await sleep(20 * 1000)
        count++;
    }
}

(async () => {
    const response = await skt.start();
    console.log({
        start: response
    })
})();
