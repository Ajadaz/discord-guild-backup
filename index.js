import fs from "fs/promises";
import { downloadFile, fetchWithDiscordAuth } from "./util.js";

const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";
const prettyPrint = false;

if(!process.argv[2])
{
    console.error("Usage: node index.js <guild_id>");
    process.exit(1);
}

if(!process.env.AUTH_TOKEN)
{
    console.error("No authorization token specified");
    process.exit(1);
}

const guildResp = await fetchWithDiscordAuth(`${DISCORD_API_ENDPOINT}/guilds/${process.argv[2]}`);
const channelsResp = await fetchWithDiscordAuth(`${DISCORD_API_ENDPOINT}/guilds/${process.argv[2]}/channels`);
let guild = await guildResp.json();
let channels = await channelsResp.json();
guild.channels = channels;

console.log(`Backuping guild ${guild.name}...`);
await fs.mkdir(guild.name, { recursive: true });
await fs.writeFile(`${guild.name}/guild.json`, JSON.stringify(guild, null, prettyPrint ? 4 : null));

for(const channel of channels)
{
    console.log(`Found channel ${channel?.name}`);
    let messages = [];
    let messageStep = [];
    let afterId = "";
    do
    {
        const queryString = afterId ? `?before=${afterId}` : "";
        const messageUrl = `${DISCORD_API_ENDPOINT}/channels/${channel.id}/messages${queryString}`;
        const messagesStepResp = await fetchWithDiscordAuth(messageUrl);
        messageStep = await messagesStepResp.json();
        if(messagesStepResp.status === 429)
        {
            console.log(`Rate limit. Retrying in ${messageStep.retry_after}`);
            await new Promise(resolve => setTimeout(resolve, messageStep.retry_after * 1000));
            continue;
        }
        afterId = messageStep[messageStep.length - 1]?.id;
        messages = messages.concat(messageStep);
    } while(messageStep.length > 0)

    if(messages.length === 0)
    {
        console.log("No messages found. Skipping")
        continue;
    }

    console.log(`Found ${messages.length} messages. Saving to file...`);

    await fs.mkdir(`${guild.name}/${channel.name}`, { recursive: true });

    for(const [i, message] of messages.entries())
    {
        if(i % 50 === 0)
        {
            console.log(`${i}/${messages.length} Saving assets from messages...`)
        }
        for(const embed of message.embeds)
        {
            if(embed.thumbnail)
            {
                await getDiscordAsset(
                    embed.thumbnail,
                    "url",
                    `${guild.name}/${channel.name}/thumb_${message.id}`,
                    "proxy_url",
                    `${guild.name}/${channel.name}/pthumb_${message.id}`);
            }
            if(embed.video && embed.video.url)
            {
                await getDiscordAsset(
                    embed.video,
                    "url",
                    `${guild.name}/${channel.name}/vid_${message.id}`,
                    "proxy_url",
                    `${guild.name}/${channel.name}/pvid_${message.id}`);
            }
            if(embed.image)
            {
                await getDiscordAsset(
                    embed.image,
                    "url",
                    `${guild.name}/${channel.name}/img_${message.id}`,
                    "proxy_url",
                    `${guild.name}/${channel.name}/pimg_${message.id}`);
            }
            if(embed.author && embed.author.icon_url)
            {
                await getDiscordAsset(
                    embed.author,
                    "icon_url",
                    `${guild.name}/${channel.name}/auth_${message.id}`,
                    "proxy_icon_url",
                    `${guild.name}/${channel.name}/pauth_${message.id}`);
            }
        }

        for(const attachment of message.attachments)
        {
            await getDiscordAsset(
                attachment,
                "url",
                `${guild.name}/${channel.name}/${attachment.filename}`,
                "proxy_url",
                `${guild.name}/${channel.name}/p${attachment.filename}`);
        }
    }

    await fs.writeFile(`${guild.name}/${channel.name}/messages.json`, JSON.stringify(messages, null, prettyPrint ? 4 : null));
}

async function getDiscordAsset(obj, targetProperty, fileName, proxyProperty, proxyFileName)
{
    const backupFile = await downloadFile(obj[targetProperty], fileName);
    if(backupFile !== null)
        obj.backupFile = backupFile;
    else if(obj[proxyProperty])
    {
        console.log("Trying proxy...")
        const backupFile = await downloadFile(obj[proxyProperty], proxyFileName);
        if(backupFile !== null)
            obj.proxyBackupFile = backupFile;
    }
}
