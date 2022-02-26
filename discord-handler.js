const Discord = require('discord.js');
// const {
//     prefix,
//     token,
//     google_api_key,
//     client_secret
// } = require('./credentials');
const prefix = '!'
const token = process.env.DISCORD_TOKEN
const utils = require('./utils');
const playdl = require("play-dl");
const url = require("url");
const {YoutubeVideo} = require("./api-handler")

class Queue extends Array {
    constructor(io, guildId) {
        super();
        this.io = io;
        this.guildId = guildId;
    }

    push(...items) {
        super.push(...items);
        this.update()
    }

    shift() {
        super.shift();
        this.update();
    }

    remove(idx) {
        super.splice(idx, 1);
        this.update();
    }

    update() {
        this.io.to(this.guildId).emit('queue:update');
    }
}

class ServerStore {
    constructor(message, io) {
        this.id = message.guild.id;
        this.textChannel = message.channel;
        this.voiceChannel = message.member.voice.channel;
        this.connection = null;
        this.songs = new Queue(io, message.guild.id);
        this.volume = 5;
        this.playing = false;
        this.users = new Map();
    }
}

class DiscordHandler {
    constructor(youtubeHandler, io) {
        this.commands = new Map();
        this.servers = new Map();
        this.client = new Discord.Client();
        this.youtubeHandler = youtubeHandler;
        this.io = io;

        this.client.login(token);

        this.client.once('ready', () => {
            console.log('Ready!');
        });
        this.client.once('reconnecting', () => {
            console.log('Reconnecting!');
        });
        this.client.once('disconnect', () => {
            this.servers.clear();
        });
        this.onCommand('playlist', async (message) => {
            await this.listPlaylist(message);
        });
        this.onCommand('play', async (message) => {
            await this.execute(message);
        });
        this.onCommand('skip', async (message) => {
            await this.skip(message);
        });
        this.onCommand('like', async (message) => {
            await this.listLiked(message);
        });
        this.onCommand('listqueue', async (message) => {
            await this.listQueue(message);
        });
        this.onCommand('stop', async (message) => {
            await this.stop(message);
        });
        this.onCommand('help', async (message) => {
            await this.help(message);
        });
        this.onCommand('website', async (message) => {
            await this.getWebsiteUrl(message);
        })
        this.onCommand('test', async (message) => {
            console.log(message.author.id);
        })
        this.client.on('message', async message => {
            if (message.author.bot) return;
            if (!message.content.startsWith(prefix)) return;

            let cmd = message.content.split(' ')[0];
            let func = this.commands.get(cmd);
            if (func) {
                try {
                    await func(message);
                } catch (e) {
                    console.log(e);
                    this.onError();
                }
            }
        });
    }

    async execute(message) {
        const args = message.content.split(" ");

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send(
                "You need to be in a voice channel to play music!"
            );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(
                "I need the permissions to join and speak in your voice channel!"
            );
        }

        return await this.queueSong(message, await this.youtubeHandler.fetchSong(args[1]))
    }

    async getWebsiteUrl(message) {
        let serverQueue = this.servers.get(message.guild.id);
        if (!serverQueue)
            serverQueue = this.addServer(message)
        if (!serverQueue.connection)
            serverQueue.connection = await message.member.voice.channel.join();
        message.channel.send(`${process.env.FRONTEND_URI}?guildId=${message.guild.id}`)
    }

    getQueue(guildId) {
        let serverQueue = this.servers.get(guildId);
        if (!serverQueue)
            return []
        return serverQueue.songs;
    }

    removeFromQueue(guildId, index) {
        const serverQueue = this.servers.get(guildId);
        const song = serverQueue.songs[index];
        if (index === 0) {
            if (serverQueue && serverQueue.connection) {
                serverQueue.connection.dispatcher.end();
                this.io.to(guildId).emit('queue:update');
            }
        } else {
            if (serverQueue) {
                serverQueue.songs.remove(index);
            }
        }
        if (serverQueue.textChannel)
            serverQueue.textChannel.send(`**${song.title}** has been removed from the queue`);
    }

    help(message) {
        message.channel.send([
            '!playlist [url] [count]: play a playlist',
            '!play [url]: play a song',
            '!skip: skip a song',
            '!listqueue: list queue',
            '!stop: end session'
        ]);
    }

    async listLiked(message) {
        let serverQueue = this.servers.get(message.guild.id);
        if (!serverQueue)
            serverQueue = this.addServer(message);

        let userTag = message.author.tag;
        if (!serverQueue.users.get(userTag)) {
            let url = this.youtubeHandler.login(message.author.tag, {
                guildId: message.guild.id,
                userTag: userTag,
                callback: true
            }, this.listLiked, {
                message
            });
            message.channel.send(`Login at: ${url}`);
            return;
        }
        let res = await this.youtubeHandler.fetchList('https://www.googleapis.com/youtube/v3/videos', {
            myRating: 'like'
        }, {
            'Authorization': `Bearer ${serverQueue.users.get(userTag).access_token}`
        });
        message.channel.send(res.map((item, index) => `${index + 1}. ${item.snippet.title}`));
    }

    async listPlaylist(message) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send(
                "You need to be in a voice channel to play music!"
            );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(
                "I need the permissions to join and speak in your voice channel!"
            );
        }

        const args = message.content.split(" ");
        if (args.length < 2) {
            message.channel.send("Please provide a playlist url");
            return;
        }
        let limit = 50;
        if (args.length === 3) {
            limit = parseInt(args[2]);
        }
        let playlistId = url.parse(args[1], true).query.list;

        let res = await this.youtubeHandler.fetchList('https://youtube.googleapis.com/youtube/v3/playlistItems', {
            playlistId: playlistId,
        });
        utils.shuffle(res);

        for (let i = 0; i < res.length; i++) {
            if (i >= limit)
                return;
            let item = res[i];
            await this.queueSong(message, new YoutubeVideo(item));
        }
    }

    listQueue(message) {
        let serverQueue = this.servers.get(message.guild.id);
        if (!serverQueue || serverQueue.songs.length === 0) {
            message.channel.send('Queue is empty');
            return;
        }
        message.channel.send(serverQueue.songs.map((song, index) => `${index + 1}. ${song.title}`));
    }

    skip(message) {
        const serverQueue = this.servers.get(message.guild.id);
        if (!message.member.voice.channel)
            return message.channel.send(
                "You have to be in a voice channel to stop the music!"
            );
        if (!serverQueue)
            return message.channel.send("There is no song that I could skip!");
        serverQueue.connection.dispatcher.end();
        this.io.to(message.guild.id).emit('queue:update');
    }

    stop(message) {
        const serverQueue = this.servers.get(message.guild.id);
        if (!message.member.voice.channel)
            return message.channel.send(
                "You have to be in a voice channel to stop the music!"
            );

        if (!serverQueue)
            return message.channel.send("There is no song that I could stop!");

        serverQueue.songs = [];
        serverQueue.voiceChannel.leave();
        serverQueue.connection = null;
        this.servers.delete(message.guild.id);
        this.io.to(message.guild.id).emit('queue:update');
    }

    addServer(message) {
        let server = new ServerStore(message, this.io);
        this.servers.set(message.guild.id, server);
        return server;
    }

    async playSong(guildId, song) {
        const serverQueue = this.servers.get(guildId);
        if (!song)
            return;
        if (serverQueue.playing)
            return;
        serverQueue.playing = true;
        let stream = await playdl.stream(song.url, { discordPlayerCompatibility : true })

        const dispatcher = serverQueue.connection
            .play(stream.stream)
            .on("start", () => {
                serverQueue.textChannel.send(`Start playing: **${song.title}**`);
            })
            .on("finish", () => {
                serverQueue.playing = false;
                serverQueue.songs.shift();
                this.playSong(guildId, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }

    async queueSong(message, song) {
        let serverQueue = this.servers.get(message.guild.id);
        if (!serverQueue)
            serverQueue = this.addServer(message);
        if (!serverQueue.connection)
            serverQueue.connection = await message.member.voice.channel.join();
        serverQueue.songs.push(song);
        message.channel.send(`**${song.title}** has been added to the queue!`);
        await this.playSong(message.guild.id, serverQueue.songs[0]);
    }

    async queueSongFromWebsite(guildId, song) {
        let serverQueue = this.servers.get(guildId);
        if (!serverQueue || !serverQueue.connection)
            return false
        serverQueue.songs.push(song);
        if (serverQueue.textChannel)
            serverQueue.textChannel.send(`**${song.title}** has been added to the queue!`);
        await this.playSong(guildId, serverQueue.songs[0]);
    }

    onCommand(cmd, func) {
        if (!cmd.startsWith(prefix))
            cmd = `${prefix}${cmd}`;
        this.commands.set(cmd, func);
    }

    async onYoutubeLogin(tokens, state) {
        let serverQueue = this.servers.get(state.guildId);

        serverQueue.users.set(state.userTag, {
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date
        });
        if (state.callback) {
            let {
                callback,
                callbackParams
            } = this.youtubeHandler.getTempObject(state.userTag);
            let {
                message
            } = callbackParams;
            callback(message);
        }
    }

    onError() {

    }
}

module.exports = {
    DiscordHandler
};