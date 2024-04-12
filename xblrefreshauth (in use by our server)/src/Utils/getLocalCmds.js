const path = require("path")
const getAllFiles = require("./getFiles")
module.exports = (exceptions=[]) => { 
  let localCommands = []

  const cmdCategories = getAllFiles(
    path.join(__dirname,'..',"Commands"),true
  )
  for (const cmdCategory of cmdCategories) { 
    const cmdFiles = getAllFiles(cmdCategory)
    
    for (const cmdFile of cmdFiles) {
      const cmdObj = require(cmdFile)
      
      if (exceptions.includes(cmdObj.name)) {
        contine
      }

      localCommands.push(cmdObj)
    }
  }
  return localCommands
}