require('dotenv').config();
const Option = require('./option');
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const TOKEN = process.env.TOKEN;

client.login(TOKEN);

let title = "WHAT :b:OVIE?"
let emojiList = ['0⃣','1⃣', '2⃣', '3⃣', '4⃣','5⃣', '6⃣', '7⃣', '8⃣', '9⃣']

/* TODO
  use ReactionManager instead of collector (or just fuk the un-reacts)
  Maybe OptionsList class for managing adds/removes/votes
*/

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}!`);
});

let data = fs.readFileSync('data.json');
let dataJSON = JSON.parse(data)
let linkToOG = null
let ogMessage = null
const commandsStr = '**commands**:\n  *boi list\n  *boi add Some Movie\n  *boi remove X (where X is the blue number)'

/***** COMMANDS ******
  boi
    add
      title
    remove
      id OR title
    list - show list
*/

client.on('message', async msg => {
  const messageArray = msg.content.split(' ')
  const cmd = messageArray[0]
  const subCmd = messageArray[1]
  const args = messageArray.slice(2)

  if (ogMessage === null) {
    if (dataJSON.messageId !== null) {
      ogMessage = await msg.channel.messages.fetch(dataJSON.messageId)
      let collector = new Discord.ReactionCollector(ogMessage, (reaction, user) => collectReact(reaction, user))
    }
  }

  if (cmd === 'boi') {
    switch (subCmd) {
      case 'list':
        sendListLink(msg.channel)
        return
      case 'add':
        await addToList(msg, args)
        break
      case 'remove':
        removeFromList(args[0])
        break
      default:
        msg.channel.send(`Unknown command.\n${commandsStr}`)
    }
    displayPoll(msg.channel)
  }
})

const sendListLink = (channel) => {
  let list = dataJSON.list
  if (list.length === 0) {
    channel.send('Movie list is empty. Type ```boi add Movie Title``` to add')
  }
  else {
    channel.send(`View the movie list here: ${dataJSON.linkToOG}`)
  }
}

const addToList = async (msg, args) => {
  let list = dataJSON.list
  if (dataJSON.availableIds.length === 0) {
    removeFromList(list[list.length-1].id)
  }
  console.log(dataJSON.availableIds)
  const name = args.join(' ')
  const newId = dataJSON.availableIds.shift()
  dataJSON.list.push(new Option(newId, name))
  save()
  if (ogMessage !== null) {
    ogMessage.react(emojiList[newId])
  }
}

const removeFromList = idToRemove => {
  let newList = dataJSON.list.filter(opt => parseInt(opt.id) !== parseInt(idToRemove))
  if (dataJSON.list.length !== newList.length) {
    dataJSON.availableIds.push(parseInt(idToRemove))
  }
  dataJSON.list = newList
  if (ogMessage !== null) {
    let emojiToRemove = (ogMessage.reactions.cache.get(emojiList[idToRemove]))
    if (emojiToRemove) {
      emojiToRemove.remove().catch(console.error)
    }
  }
  save()
}

const displayPoll = async channel => {
  const list = dataJSON.list
  list.sort((a, b) => b.votes.length - a.votes.length)
  let embedPoll = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(
      list.map(option => `${emojiList[option.id]} ${option.name} ${option.votes.length > 0 ? '(' + option.votes.join(', ') + ')': ''}`)
    )

  if (ogMessage === null) {
    let msgEmbed = await channel.send(embedPoll)
    let collector = new Discord.ReactionCollector(msgEmbed, (reaction, user) => collectReact(reaction, user, channel))
    dataJSON.messageId = msgEmbed.id
    save()
    ogMessage = msgEmbed

    for (let i=0; i<list.length; i++) {
      msgEmbed.react(emojiList[list[i].id])
    }
  }
  else {
    // modify the message
    await ogMessage.edit('', {embed: embedPoll})
      .catch(console.error)
  }

  ogMessage.edit(commandsStr)

  if (!dataJSON.linkToOG) {
    dataJSON.linkToOG = `https://discordapp.com/channels/${channel.guild.id}/${channel.id}/${ogMessage.id}`
  }
  save()

}

const collectReact = (reaction, user, channel) => {
  const username = user.tag
  if (username === "Movie Boi#8782") return

  const movieId = emojiList.findIndex(emoji => reaction._emoji.name === emoji)
  const movieToUpdate = dataJSON.list.find(movie => movie.id === movieId)

  movieToUpdate.votes = [...new Set([...movieToUpdate.votes, username.split('#')[0]])]
  save()
  displayPoll(channel)
}

const save = () => {
  fs.writeFileSync('data.json', JSON.stringify(dataJSON, null, 2))
}