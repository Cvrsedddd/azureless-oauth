const { Authflow, Titles } = require('prismarine-auth');
const username = process.argv[2];
const id = process.argv[3]; // Add a parameter to accept the "id"
const cacheDir = 'xbl'

async function doAuth() {
  const flow = new Authflow(username, cacheDir, { authTitle: Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' });
  const response = await flow.getMinecraftJavaToken({ fetchEntitlements: true, fetchProfile: true, fetchCertificates: true });


  console.log(response);
  console.log(`id: '${id}'`); // Print the "id" for reference
}
module.exports = doAuth();