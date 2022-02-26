const {
    prefix,
    token,
    google_api_key
} = require('./config.json');
const fs = require("fs");

const client_secret = JSON.parse(fs.readFileSync('client_secret.json'))

module.exports = {
    prefix,
    token,
    google_api_key,
    client_secret
};