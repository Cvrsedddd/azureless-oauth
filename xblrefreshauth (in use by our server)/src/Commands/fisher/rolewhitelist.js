const { ApplicationCommandOptionType } = require("discord.js");
const { devs } = require("../../../config.json")
const { whitelistedroles } = require("../../../config.json")
const fs = require("fs");
const path = require("path");
module.exports = {
    name: 'roles',
    description: 'list/add/remove whitelisted roles',
    options: [{
        name: `roleid`,
        description: `ID of the role to add/remove`,
        required: false,
        type: ApplicationCommandOptionType.Role
    }],
    callback: async (client, interaction) => {
        let id = interaction.options.getRole("roleid")
        let ownerId = interaction.user.id
        let conf = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "config.json")))
        if (!devs.includes(ownerId)) {
            return interaction.reply({
                embeds: [{
                    title: `Invalid permissions!`,
                    description: `You don't have enough permissions to use this cmd!`,
                    color: 0xff0000
                }],
                ephemeral: true
            })
        }
        if (!id) {
            let desc = ""
            let i = 0
            for (let wid of conf.whitelistedroles) {
                i++
                let roleName = `Couldn't fetch name`
                try {
                    roleName = await interaction.guild.roles.cache.find(role => role.id === wid).name
                    desc += `${i}] ${roleName} | ${wid}\n`
                } catch (e) {
                    desc += `${i}] ${wid}\n`
                    console.log(e)
                }
            }
            return interaction.reply({
                embeds: [{
                    title: `Whitelisted roles`,
                    description: desc,
                    color: 0x00ff00
                }],
                ephemeral: true
            })
        } else {
            if (conf.whitelistedroles.includes(id.id)) {
                try {
                    conf.whitelistedroles = conf.whitelistedroles.filter((role) => role !== id.id)
                    fs.writeFileSync(path.join(__dirname, "..", "..", "..", "config.json"), JSON.stringify(conf, null, 2))
                    return interaction.reply({
                        embeds: [{
                            title: `Success`,
                            description: `Removed ${id.id} from the whitelisted roles!`,
                            color: 0x00ff00
                        }]
                    })
                } catch (e) {
                    console.log(e)
                    return interaction.reply({
                        embeds: [{
                            title: `Failed`,
                            description: `Failed while trying to remove ${id.id}`,
                            color: 0xff0000
                        }]
                    })
                }
            } else {
                try {
                    conf.whitelistedroles.push(id.id)
                    fs.writeFileSync(path.join(__dirname, "..", "..", "..", "config.json"), JSON.stringify(conf, null, 2))
                    return interaction.reply({
                        embeds: [{
                            title: `Success`,
                            description: `Added ${id.id} to the whitelisted roles!`,
                            color: 0x00ff00
                        }]
                    })
                } catch (e) {
                    console.log(e)
                    return interaction.reply({
                        embeds: [{
                            title: `Failed`,
                            description: `Failed while trying to add ${id.id}`,
                            color: 0xff0000
                        }]
                    })
                }
            }
        }
    },
};