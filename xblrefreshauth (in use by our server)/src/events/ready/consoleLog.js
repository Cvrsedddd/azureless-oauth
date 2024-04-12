const cli = require('cli-color')
module.exports = (client, interaction) => { 
  console.log(cli.green(`${client.user.tag} is running...`))
}