const { Command } = require("discord.js-commando");
const { DateTime } = require("luxon");
const DiscordUtil = require('../../common/discordutil.js');

module.exports = class TempRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: "temp-role",
      aliases: ["tempr", "temprole"],
      group: "roles",
      memberName: "temp-role",
      description: "Adds a new role to a list of users for a limited time. Attach a csv or txt file with a list of all the usernames, one per line that you would like to add the role to. The format for the date to remove the role is YYYY-MM-DD HH:MM",
      userPermissions: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
      args: [
        {
          key: "deadline",
          prompt: "When is the time you would like to remove the role in CST?",
          type: "string",
          validate: (deadline) => {
            const deadlineDateTime = DateTime.fromSQL(deadline, {
              zone: "America/Chicago",
            });
            if (!deadlineDateTime.isValid) {
              return "Invalid deadline provided. Please enter deadline in correct format. YYYY-MM-DD HH:MM";
            }

            const deadlineInUTC = deadlineDateTime.toUTC();
            const currentTimeUTC = DateTime.utc();

            if (currentTimeUTC > deadlineInUTC) {
              return "Deadline is in past. Invalid datetime provided.";
            }
            return true;
          },
        },
        {
          key: "roleID",
          prompt: "What role would you like to temporarily add to user?",
          type: "string",
        }, 
        { key: "fileURL",
          prompt: "Add a file link if you haven't attached a file in the first message", 
          type: "string"
        }
      ],
    });
  }

  run(message, { deadline, roleID, fileURL }) {
    const discordClient = message.client;
    const cst = "America/Chicago";

    const deadlineDateTime = DateTime.fromSQL(deadline, {
      zone: cst,
    });
    const deadlineInUTC = deadlineDateTime.toUTC();
    
    const attachment = message.attachments.values().next().value;
    var attachmentURL;
    if (!attachment && fileURL.length > 1) {
      attachmentURL = fileURL;       
    }
    if (attachment){
      attachmentURL = attachment.url;
    }
    else {
      return message.reply("No valid file")
    }
    
    DiscordUtil.openFileAndDo(attachmentURL, function(member){ member.roles.add([roleID]); }, message);

    this.removeRoleAtDeadline(deadlineInUTC, message.channel, roleID, attachmentURL, message);

    const deadlineMessage =
      "Deadline (CST): " + deadlineDateTime.toLocaleString(DateTime.DATETIME_SHORT);
    const reminderPromise =
      "I will send reminder";
    const newLine = "\n";

    const fullMessage = deadlineMessage.concat(
      newLine,
      newLine,
      reminderPromise
    );

    return message.reply(fullMessage);
  }

  removeRoleAtDeadline(timeToRemoveRole, channel, roleID, attachmentURL, message) {
    const currentTimeUTC = DateTime.utc();

    const timeLeftBeforeRemovingRole = timeToRemoveRole.toMillis() - currentTimeUTC.toMillis();
    // TODO: Maybe can use Duration
    if (timeLeftBeforeRemovingRole > 0) {
      setTimeout(
        function () {
          DiscordUtil.openFileAndDo(attachmentURL, function(member){ member.roles.remove([roleID]); }, message);
          channel.send(`The role <@&${roleID}> has been removed`);
        },
        timeLeftBeforeRemovingRole,
        channel
      );
    }
  }
};
