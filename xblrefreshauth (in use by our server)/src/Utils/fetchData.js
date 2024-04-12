const axios = require("axios")
const { hypixelApiKey } = require("../../config.json")
const { getNetworth } = require("skyhelper-networth")
const humanFormat = require("human-format")
module.exports = async (user) => {

    // Grab UUID

    await axios.get("https://api.mojang.com/users/profiles/minecraft/" + user.mcname).then((res) => {
        if (res.data.id) {
            user.uuid = res.data.id
        }
    }).catch(err => {
        return console.log("" + err)
    })

    // Grab profiles


    if (!user.uuid) return console.log("There is no account with the name " + user.mcname)
    await axios.get(`https://api.hypixel.net/v2/skyblock/profiles?key=${hypixelApiKey}&uuid=${user.uuid}`).then((res) => {
        let profiles = res.data.profiles
        if (profiles) {
            for (let profile of profiles) {
                if (profile.selected) {
                    user.activeProfile = profile.profile_id
                    if (Object.keys(profile.members).length == 1) {
                        user.solo = true
                    } else {
                        user.solo = false
                    }
                }
            }
        }
    })
    // Grab networth
    if (user?.activeProfile) {
        await axios.get(`https://api.hypixel.net/v2/skyblock/profile?key=${hypixelApiKey}&uuid=${user.uuid}&profile=${user.activeProfile}`).then(async (res) => {
            let profiles = res.data
            let profile = profiles.profile.members[user.uuid]
            let bankBalance = 0
            if (profiles.profile.banking) {
                bankBalance = profiles.profile.banking.balance
            }
            const networth = await getNetworth(profile, bankBalance, { v2Endpoint: true });
            user.networth = humanFormat(Math.round(networth.networth)).replace("G", "B").replace(" ", "")
            user.unsoulboundnetworth = humanFormat(Math.round(networth.unsoulboundNetworth)).replace("G", "B").replace(" ", "")
            user.liquid = humanFormat(Math.round(networth.bank + networth.purse)).replace("G", "B").replace(" ", "")
        }).catch(err => { return console.log(err) }).finally()

    }

    // Check if online


}