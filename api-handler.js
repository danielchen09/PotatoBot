const {google} = require("googleapis");
// const {
//     prefix,
//     token,
//     google_api_key,
//     client_secret
// } = require('./credentials');
const google_api_key = process.env.GOOGLE_API_KEY;
const client_secret = {
    web: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
    }
}
const axios = require("axios");
const {URLSearchParams} = require("url");

class YoutubeVideo {
    constructor(item) {
        this.id = item.id
        this.url = `https://youtube.com/watch?v=${this.id}`;
        this.title = item.snippet.title
        this.author = item.snippet.channelTitle.replace(' - Topic', '')
        this.thumbnail = item.snippet.thumbnails.default.url
    }
}

class YoutubeHandler {
    constructor() {
        this.userTempStorage = new Map();
        this.oauth2Client = new google.auth.OAuth2(
            client_secret.web.client_id,
            client_secret.web.client_secret,
            'http://localhost:8080/auth'
        );
    }

    login(user, state, callback, callbackParams) {
        if (callback) {
            this.userTempStorage.set(user, {
                callback,
                callbackParams
            });
        }
        return this.oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'online',
            state: Buffer.from(JSON.stringify(state)).toString('base64'),
            scope: [
                'https://www.googleapis.com/auth/youtube'
            ]
        });
    }

    async fetchSong(url) {
        let id = new URLSearchParams(url.split('?')[1]).get('v');
        let payload = {
            part: 'snippet',
            id: id,
            key: google_api_key
        }
        let res = await axios({
            method: 'get',
            url: `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams(payload)}`
        });
        if (res.data.items) {
            return new YoutubeVideo(res.data.items[0]);
        }
    }

    async fetchList(endpoint, payload, headers = {}, nextPageToken="", pages=0) {
        if (pages > 5)
            return [];
        payload = {
            ...payload,
            part: 'snippet',
            key: google_api_key
        }
        if (nextPageToken) {
            payload.pageToken = nextPageToken;
        }
        let res = await axios({
            method: 'get',
            url: `${endpoint}?${new URLSearchParams(payload)}`,
            headers: headers
        });

        if (res.data.nextPageToken)
            return res.data.items.concat(await this.fetchList(endpoint, payload, headers, res.data.nextPageToken, pages + 1));
        return res.data.items;
    }

    getTempObject(user) {
        let tempObject = this.userTempStorage.get(user);
        if (tempObject)
            this.userTempStorage.delete(user);
        return tempObject;
    }
}

module.exports = {YoutubeVideo, YoutubeHandler};