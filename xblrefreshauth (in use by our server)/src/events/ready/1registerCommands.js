const {testServer} = require("../../../config.json")
const cli = require('cli-color')
const areCommandsDifference = require("../../Utils/areCommandsDifference")
const getApplicationCommands = require("../../Utils/getApplicationCommands")
const getLocalCmds = require("../../Utils/getLocalCmds")
module.exports = async (client) => {
  
  try {
    const localCMDS = getLocalCmds()
    const applicationCommands = await getApplicationCommands(client, testServer)
    
    for (const localCMD of localCMDS) { 
      const { name, description, options } = localCMD
      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      )
      if (existingCommand) {
        if (localCMD.deleted) {
          await applicationCommands.delete(existingCommand.id)
          console.log(cli.red(`🗑️Deleted command ${name}`))
          continue
        }
        if (areCommandsDifference(existingCommand, localCMD)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options
          })
          console.log(cli.yellow(`🔁Edited command ${name}`))
        }
      } else { 
        if (localCMD.deleted) { 
          console.log(cli.yellow(`⏭️Skipping command ${name}`))
          continue
        }
        await applicationCommands.create({
          name,description,options
        })
        console.log(cli.green(`✅Registered command ${name}`))
      }
    }
  } catch (error) {
    console.log(error)
  }
}