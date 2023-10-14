import fetch from "node-fetch";
import fs from "fs/promises";

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

const guild = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${process.argv[2]}`, {
    headers: {
        "Authorization": `Bot ${process.env.AUTH_TOKEN}`
    }
});

console.log(await guild.json());
