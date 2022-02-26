const http = require('http');
const express = require('express');
const {Server} = require('socket.io');
const path = require('path');
const cors = require('cors');
const {YoutubeHandler} = require('./api-handler');
const {DiscordHandler} = require('./discord-handler');
const axios = require("axios");



const app = express();
app.use(cors({
    origin: "http://localhost:3000"
}));
app.use(express.json());
const port = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI
    }
});

youtubeHandler = new YoutubeHandler();
discordHandler = new DiscordHandler(youtubeHandler, io);

app.get('/auth', async function(req, res) {
    const {tokens} = await youtubeHandler.oauth2Client.getToken(req.query.code)
    let state = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));

    await discordHandler.onYoutubeLogin(tokens, state);
    res.sendFile(path.join(__dirname, '/auth.html'));
});

app.post('/addsong', (req, res) => {
    let song = req.body.song;
    let guildId = req.body.guildId;
    discordHandler.queueSongFromWebsite(guildId, song);
});

app.post('/removesong', (req, res) => {
    let index = req.body.index;
    let guildId = req.body.guildId;
    discordHandler.removeFromQueue(guildId, index);
})

app.get('/listqueue', async function(req, res) {
    let guildId = req.query.guildId;
    res.json({
        queue: discordHandler.getQueue(guildId)
    });
});

io.on('connection', (socket) => {
    socket.on('join', (guildId) => {
        socket.join(guildId);
    });

    socket.on('error', function (err) {
        console.log(err);
    });

    socket.on('test', (data) => {
        console.log('test')
    });
});

server.listen(port, () => {
    console.log('Server started at http://localhost:' + port)
});