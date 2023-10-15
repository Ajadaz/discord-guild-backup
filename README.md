# Discord Guild Backup tool

A little tool I decided to code up for exporting all
messages and their assets from a certain Discord server.
The script uses bot auth tokens and was made to be used
that way, but there may be auxiliary uses.

Usage:

```sh
AUTH_TOKEN=<bot_auth_token> node index.js <guild_id>
```

The tool creates a directory with the name of the guild
to be backed up and stores guild info `guild.json`.
It then creates a subfolder for each channel. It stores
**all** messages in a single json file, which
might be non optimal if a channel has > 10,000 messages.