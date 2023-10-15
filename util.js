import fetch from "node-fetch";
import fs from "fs/promises";

/** @param { URL | import("node-fetch").RequestInfo } url
 *  @param { import("node-fetch").RequestInit } [init]
 *  @return { Promise<Response> }
 */
export function fetchWithDiscordAuth(url, init = {})
{
    return fetch(url, {
        ...init,
        headers: {
            "Authorization": `Bot ${process.env.AUTH_TOKEN}`
        }
    })
}

export async function downloadFile(url, fileName)
{
    let newFileName = await getUniqueFileName(fileName);
    try
    {
        const request = await fetch(url);
        const cont = await request.arrayBuffer();
        if(request.status < 200 || request.status > 299)
        {
            console.log(`WARN Non 200 response on "${newFileName}" from "${url}". Dead file?`);
            return null;
        }
        if(cont.byteLength === 0)
        {
            console.log(`WARN Empty file "${newFileName}" from "${url}". Dead file?`);
            return null;
        }
        await fs.writeFile(newFileName, Buffer.from(cont));
    }
    catch (e)
    {
        console.log(`WARN Failed to write file "${newFileName}" from "${url}". Dead domain?`);
        return null;
    }
    return newFileName;
}

async function getUniqueFileName(fileName)
{
    let newFileName = fileName;
    let counter = null;
    while(await fileExists(newFileName))
    {
        if(counter === null)
            counter = 0;
        const splitFileName = fileName.split(".")
        if(splitFileName.length === 1)
        {
            newFileName = `${splitFileName[0]}_${counter}`;
        }
        else
        {
            splitFileName[splitFileName.length - 2] = `${splitFileName[splitFileName.length - 2]}_${counter}`;
            newFileName = splitFileName.join(".");
        }
        counter++;
    }
    return newFileName;
}

// https://stackoverflow.com/questions/17699599/node-js-check-if-file-exists
function fileExists(file)
{
    return fs.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
}
