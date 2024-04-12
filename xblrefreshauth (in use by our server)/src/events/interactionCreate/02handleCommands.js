const { devs, testServer, logging } = require('../../../config.json')
const clc = require("cli-color");
const getLocalCmds = require('../../Utils/getLocalCmds')
const nameColor = clc.yellow
const timeColor = clc.blue
const cmdNameColor = clc.green
const txtColor = clc.white
module.exports = async (client, interaction) => { 
  if (!interaction.isChatInputCommand()) return
  
  const localCommands = getLocalCmds()
  let username = interaction.member.user.username
  try {

    const cmdObj = localCommands.find((cmd) => cmd.name === interaction.commandName)

    if (!cmdObj) return

    if (cmdObj.devOnly) {
      
      if (!devs.includes(interaction.member.id)) {
        
        if (logging) {
          console.log(clc.red(`${username} tried to run ${cmdObj.name}, but he isn't a dev ${new Date().getTime()}`))
        }

        return interaction.reply({
          content: `Only developers are allowed to run this command`,
          ephemeral: true
        })

      }
      
    }


    if (cmdObj.testOnly) { 

      if (interaction.guild.id !== testServer) {

        if (logging) {
          console.log(clc.red(`${username} tried to run ${cmdObj.name}, but he isn't in the test server`))
        }

        return interaction.reply({
          content: `This command can't be ran here`,
          ephemeral:true
        })

      }

    }



    if (cmdObj.permissionsRequired?.length) { 

      for (const permission of cmdObj.permissionsRequired) { 

        if (!interaction.member.permissions.has(permission)) {

          if (logging) {

            console.log(clc.red(`${username} tried to run ${cmdObj.name}, but he doesn't have enough permissions`))

          }
          
          return interaction.reply({

            content: `Not enough permissions`,
            ephemeral: true
            
          })

        }

      }

    }


    if (cmdObj.botPermissions?.length) { 

      for (const permission of cmdObj.botPermissions) { 

        const bot = interaction.guild.members.me

        if (!bot.permissions.has(permission)) { 

          if (logging) {

            console.log(clc.red(`${username} tried to run ${cmdObj.name}, but the bot doesn't have the required roles`))

          }
          return interaction.reply({

            content: `I don't have enough permissions`,
            ephemeral: true
            
          })

        }

      }

    }
    


    if (cmdObj.rolesRequired?.length) {

      for (const role of cmdObj.rolesRequired) {

        if (!interaction.member.roles.cache.has(role)) {

          if (logging) {

            console.log(clc.red(`${username} tried to run ${cmdObj.name}, but he doesn't have the required roles`))

          }

          return interaction.reply({

            content:`You don't have the roles required`,
            ephemeral: true
            
          })

        }

      }

    }

    let initial = new Date()
    console.log(txtColor(`Started executing the command `)+cmdNameColor(`${cmdObj.name}`)+txtColor(` at `)+timeColor(`${initial.getHours()}:${initial.getMinutes()}:${initial.getSeconds()}`+txtColor(` for `)+nameColor(username)))
    await cmdObj.callback(client, interaction)
    let final = new Date()
    console.log(txtColor(`Finished executing the command `)+cmdNameColor(`${cmdObj.name}`)+txtColor(` for`)+nameColor(` ${username}`)+txtColor(` at `)+timeColor(`${final.getHours()}:${final.getMinutes()}:${final.getSeconds()}`)+txtColor(`, this process took `)+timeColor(`${(Math.abs((final.getTime()-initial.getTime()) / 1000))}ms`))

  } catch (error) {
    console.log(`There was an error running this command,${error}`)
  }
}