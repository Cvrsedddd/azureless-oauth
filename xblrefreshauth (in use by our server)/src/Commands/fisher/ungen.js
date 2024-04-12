const { ApplicationCommandOptionType } = require('discord.js')
const { query } = require('../../db/db')
module.exports = {
    name: "ungen",
    description: 'Delete an oauth link',
    options: [
        {
            name: "id",
            description: "ID of the link",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    callback: async (client, interaction) => {
        const iId = interaction.options.getString("id")
        let ids = await query(`SELECT * FROM links WHERE link='${iId}'`)
        if (ids.length == 0) {
            return interaction.reply(
                {
                    embeds: [{
                        title: `ERROR`,
                        description: `Couldn't find this ID`,
                        color: 0xff0000
                    }],
                    ephemeral: true
                }
            )
        }
        let id = ids[0]
        if (id.owner_id != interaction.user.id) {
            return interaction.reply({
                embeds: [{
                    title: `ERROR`,
                    description: `This isn't your ID!`,
                    color: 0xff0000
                }],
                ephemeral: true
            })
        }
        await query(`DELETE FROM links WHERE link='${iId}'`, "run")
        return interaction.reply({
            embeds: [{
                title: `Success :tada:`,
                description: `Deleted your ID successfully!`,
                color: 0x00ff00
            }],
            ephemeral: true
        })
    }
}