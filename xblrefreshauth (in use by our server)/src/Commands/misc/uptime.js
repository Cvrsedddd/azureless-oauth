const {ApplicationCommandOptionType,PermissionFlagsBits} = require('discord.js')
const startintTime = new Date()
module.exports = {
  name: "uptime",
  description: 'retreives the uptime of the bot',
  devOnly:true,
  //testOnly: true,
  //rolesRequired:["1178069041328427117"],
  callback: (client, interaction) => {
    return interaction.reply({
      content: `The bot has been up for ${Math.round(Math.abs((new Date().getTime()-startintTime.getTime()) / 1000))} seconds!`,
      ephemeral: true
    })
  }
}