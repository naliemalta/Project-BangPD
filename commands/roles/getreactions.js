const { Command } = require("discord.js-commando");
const DiscordUtil = require('../../common/discordutil.js');

module.exports = class RemoveRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: "getreactions",
      aliases: ["getr"],
      group: "roles",
      memberName: "get-reactions",
      description: "",
      userPermissions: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
      args: [
        {
          key: "messageID",
          prompt: "What message would you like to get reactions from?",
          type: "string",
        },
        {
            key: "channel",
            prompt: "In what channel is this message?",
            type: "channel",
          },
      ],
    });
  }

  run(message, { messageID, channel }) {

    channel.messages.fetch(messageID).then( ReactionsMessage => {
        var users = {};
        ReactionsMessage.reactions.cache.forEach(reaction => {
            users[reaction.emoji] = []
            reaction.users.fetch().then( result => {
                result.forEach( user => {
                    users[reaction.emoji].push(user.username + "#" + user.discriminator);
                })
                var attachment = new Discord.MessageAttachment(Buffer.from(`${users[reaction.emoji].join('\n')}`, 'utf-8'), 'emoji reactions.txt');
                message.channel.send(`Users that reacted with ${reaction.emoji}`, attachment);
            });
        });
    }).catch(function(error) {
        message.reply(`Message with ID ${messageID} wasn't found in channel <#${channel.id}>`)
      });


   // attachment = new Discord.MessageAttachment(Buffer.from(`${usersChanged.join('\n')}`, 'utf-8'), 'changedusers.txt');
    //  message.channel.send('Changed users', attachment);

  }

}