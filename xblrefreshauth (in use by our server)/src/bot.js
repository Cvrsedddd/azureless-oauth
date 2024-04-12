const discord = require("discord.js")
const eventHandler = require("./Handlers/eventHandler.js")
const { token } = require("../config.json")
const { initialize, query } = require("./db/db.js")
const { app } = require("./server/webserver.js")
const axios = require("axios")
const port = 80;
var cron = require('node-cron');
const fetchData = require("./Utils/fetchData.js")


// Starting discord client
initialize()

app.listen(port, async () => {
  console.log(`Webserver is running on port ${port}`);

});
const client = new discord.Client({
  intents: ['Guilds', 'GuildMessages'] // Adding intents

})
eventHandler(client)

client.login(token)