const { Command } = require('discord.js-commando');
const { DateTime } = require('luxon');

module.exports = class ReminderCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'set-reminder',
			aliases: ['reminder', 'remind'],
			group: 'reminder',
			memberName: 'set-reminder',
			description: 'Sets a reminder 1 hour before deadline.',
			args: [
				{
					key: 'deadline',
					prompt: 'When is the deadline?',
					type: 'string',
					validate: deadline => {
						const deadlineDateTime = DateTime.fromSQL(deadline, { zone: 'America/Chicago' });
						if (!deadlineDateTime.isValid) {
							return 'Invalid deadline provided. Please enter deadline in correct format. YYYY-MM-DD HH:MM';
						}
						
						const deadlineInUTC = deadlineDateTime.toUTC();
        				const currentTimeUTC = DateTime.utc();

						if (currentTimeUTC > deadlineInUTC) {
							return 'Deadline is in past. Invalid datetime provided.';
						}
						return true;
					},
				},
				{
					key: 'channelID',
					prompt: 'What channel would you like me to send the reminder?',
					type: 'string',
				},
				{
					key: 'reminderMessage',
					prompt: 'What reminder message would you like me to send ?',
					type: 'string',
				},
			],
		});
	}

	run(message, { deadline, channelID, reminderMessage}) {
        const discordClient = message.client;
        const targetChannel = discordClient.channels.cache.get(channelID);

		const deadlineDateTime = DateTime.fromSQL(deadline, { zone: 'America/Chicago' });
		const deadlineInUTC = deadlineDateTime.toUTC();

        const oneHourBeforeDeadlineUTC = deadlineInUTC.minus({ hours: 1 });
        const oneHourBeforeDeadlineCST = oneHourBeforeDeadlineUTC.setZone('America/Chicago');

        this.sendReminder(oneHourBeforeDeadlineUTC, targetChannel, reminderMessage);

        const deadlineMessage = 'Deadline: ' + deadline.toLocaleString(DateTime.DATETIME_SHORT);
        const reminderHourBeforeMessage = 'Reminder set to one hour before deadline: ' + oneHourBeforeDeadlineCST.toLocaleString(DateTime.DATETIME_SHORT);
        const reminderPromise = 'I will send reminder ' + oneHourBeforeDeadlineCST.toRelative() + ' in channel : ' + targetChannel.name;
        const newLine = '\n';

        const fullMessage = deadlineMessage.concat(newLine, reminderHourBeforeMessage, newLine, reminderPromise);

		return message.reply(fullMessage);
	}

	sendReminder( timeBeforeDeadline, channel, reminderMessage) {
        const currentTimeUTC = DateTime.utc();

        const delay = timeBeforeDeadline.toMillis() - currentTimeUTC.toMillis();
        // TODO: Maybe can use Duration
        if(delay > 0 ) {
            setTimeout(function () {channel.send(reminderMessage);}, delay, channel, reminderMessage);
        }
    }
};