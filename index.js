import fetch from "node-fetch";
import fs from "fs/promises";
import { fetchWithDiscordAuth } from "./util.js";

const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

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
await fs.writeFile(`${guild.name}/guild.json`, JSON.stringify(guild, null, 4));

for(const channel of channels)
{
    console.log(`Found channel ${channel?.name}`);
    let messages = [];
    let messageStep = [];
    let afterId = "";
    do
    {
        const queryString = afterId ? `?after=${afterId}` : "";
        const messageUrl = `${DISCORD_API_ENDPOINT}/channels/${channel.id}/messages${queryString}`;
        const messagesStepResp = await fetchWithDiscordAuth(messageUrl);
        messageStep = await messagesStepResp.json();
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
    await fs.writeFile(`${guild.name}/${channel.name}/messages.json`, JSON.stringify(messages, null, 4));
}
