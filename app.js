/*
 * @Author: MuXia
 * @Date: 2022/10/23
 */
import fs from 'fs';
import Downloader from 'nodejs-file-downloader';

//用户token
const token = '';
//文件存储路径
const imgSavePath = '';

let guildList = [];

run();

async function run() {
  //获取token服务器列表
  let list = await getUserGuildsList();

  //单独提取出服务器id
  for (const i in list) {
    guildList.push(list[i].id);
  }

  for (let i = 0; i < guildList.length; i++) {
    //获取服务器信息
    let guildInfo = await getGuild(guildList[i]);

    //获取服务器表情列表
    let emojis = await getGuildEmojis(guildList[i]);

    if (emojis.length) {
      console.log(`${emojis.length} emojis found in ${guildInfo.name} 开始下载.`);

      let i = 0;
      let errorList = [];
      download(emojis, guildInfo, i, errorList);
    } else {
      console.log(`No emojis found in ${guildInfo.name}.`);
    }
  }
}

function sanitizeDirectoryName(name) {
  // 替换或删除特殊字符
  return name.replace(/[:：]/g, '-');
}

async function download(emojis, guildInfo, i, errorList) {
  if (i === emojis.length) {
    let text = `${guildInfo.name} Downloading is finished 失败${errorList.length}个.\n`;

    if (errorList.length > 0) {
      for (const key in errorList) {
        text += errorList[key] + '\n';
      }
    }
    console.log(text);
    return;
  } else {
    let guildName = guildInfo.name;
    guildName = sanitizeDirectoryName(guildName);

    const url = `https://cdn.discordapp.com/emojis/${emojis[i].id}.${emojis[i].animated ? 'gif' : 'png'}`;
    const directory = `${imgSavePath}/${guildName}`;
    const fileName = `${emojis[i].name}.${emojis[i].animated ? 'gif' : 'png'}`;

    // 确保目录存在
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const downloadFile = new Downloader({
      url,
      directory,
      fileName,
      cloneFiles: false,
    });

    try {
      await downloadFile.download();
    } catch (error) {
      errorList.push(`https://cdn.discordapp.com/emojis/${emojis[i].id}.${emojis[i].animated ? 'gif' : 'png'}`);
    }

    i++;
    download(emojis, guildInfo, i, errorList);
  }
}

async function getUserGuildsList() {
  let userGuildsList = [];

  try {
    const response = await fetch('https://discord.com/api/v9/users/@me/guilds', {
      method: 'GET',
      headers: {
        authorization: token,
      },
    });
    if (!response.ok) {
      console.log('Invalid discord_token.');
      process.exit();
    }

    userGuildsList = await response.json();
  } catch (error) {
    console.log('Error:', error);
    process.exit();
  }

  return userGuildsList;
}

async function getGuild(guild) {
  const response = await fetch(`https://discord.com/api/v9/guilds/${guild}`, {
    method: 'GET',
    headers: {
      authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return await response.json();
}

async function getGuildEmojis(guild) {
  try {
    const response = await fetch(`https://discord.com/api/v9/guilds/${guild}/emojis`, {
      method: 'GET',
      headers: {
        authorization: token,
      },
    });

    if (!response.ok) {
      console.log('Invalid guild_id/discord_token.');
      process.exit();
    }

    return await response.json();
  } catch (error) {
    console.log('Error:', error);
    process.exit();
  }
}
