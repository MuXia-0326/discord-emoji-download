/*
 * @Author: MuXia
 * @Date: 2022/10/23
 */
import axios from "axios";
import fileDownloader from "nodejs-file-downloader";

//用户token
const token = "NjM5NDEwNDM5MDMzNDU0NTky.GTz8oE.56_lwiATqFSge-eLe62rRnkQHNNKN2u-dwJz_M";
//文件存储路径
const imgSavePath = "C:/Users/chenj/Pictures/discord";

let guildList = [];

run();

async function run() {
    let list;
    //获取token服务器列表
    await getUserGuildsList().then((res) => {
        list = res;
    });

    //单独提取出服务器id
    for (const i in list) {
        guildList.push(list[i].id);
    }

    for (let i = 0; i < guildList.length; i++) {
        let emojis = [];
        let guildInfo = [];

        //获取服务器信息
        await getGuild(guildList[i]).then((res) => {
            guildInfo = res;
        });

        //获取服务器表情列表
        await getGuildEmojis(guildList[i]).then((res) => {
            emojis = res.data;
        });

        if (emojis.length) {
            console.log(`${emojis.length} emojis found in ${guildInfo.data.name} 开始下载.`);

            let aaa = 0;
            let errorList = [];
            download(emojis, guildInfo, aaa, errorList);
        } else {
            console.log(`No emojis found in ${guildInfo.data.name}.`);
        }
    }
}

async function download(emojis, guildInfo, i, errorList) {
    if (i === emojis.length) {
        let text = `${guildInfo.data.name} Downloading is finished 失败${errorList.length}个.\n`;

        if (errorList.length > 0) {
            for (const key in errorList) {
                text += errorList[key] + "\n";
            }
        }
        console.log(text);
        return;
    } else {
        const downloadFile = new fileDownloader({
            url: `https://cdn.discordapp.com/emojis/${emojis[i].id}.${emojis[i].animated ? "gif" : "png"}`,
            directory: `${imgSavePath}/${guildInfo.data.name}`,
            fileName: `${emojis[i].name}.${emojis[i].animated ? "gif" : "png"}`
        });

        try {
            await downloadFile.download();
        } catch {
            errorList.push(`https://cdn.discordapp.com/emojis/${emojis[i].id}.${emojis[i].animated ? "gif" : "png"}`);
        }

        i++;
        download(emojis, guildInfo, i, errorList);
    }
}

async function getUserGuildsList() {
    let userGuildsList = [];

    await axios({
        method: "GET",
        url: `https://discord.com/api/v9/users/@me/guilds`,
        headers: {
            authorization: token
        }
    })
        .then((res) => {
            userGuildsList = res.data;
        })
        .catch(() => {
            console.log("Invalid discord_token.");
            process.exit();
        });

    return userGuildsList;
}

async function getGuild(guild) {
    return await axios({
        method: "GET",
        url: `https://discord.com/api/v9/guilds/${guild}`,
        headers: {
            authorization: token
        }
    });
}

async function getGuildEmojis(guild) {
    return await axios({
        method: "GET",
        url: `https://discord.com/api/v9/guilds/${guild}/emojis`,
        headers: {
            authorization: token
        }
    }).catch(() => {
        console.log("Invalid guild_id/discord_token.");
        process.exit();
    });
}
