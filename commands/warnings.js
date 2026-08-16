const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Bir kullanıcının uyarılarını gösterir.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Uyarıları gösterilecek üye')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');

        if (!fs.existsSync(warningsPath)) {
            return interaction.reply({
                content: '📋 Bu kullanıcının uyarısı bulunmuyor.',
                ephemeral: true
            });
        }

        const warnings = JSON.parse(
            fs.readFileSync(warningsPath, 'utf8')
        );

        const userWarnings = warnings[user.id] || [];

        if (userWarnings.length === 0) {
            return interaction.reply(
                `✅ **${user.tag}** kullanıcısının hiç uyarısı yok.`
            );
        }

        let text = `⚠️ **${user.tag} - Uyarılar (${userWarnings.length})**\n\n`;

        userWarnings.forEach((warning, index) => {
            text +=
                `**#${index + 1}** ${warning.reason}\n` +
                `👮 ${warning.moderatorTag}\n` +
                `🕐 ${new Date(warning.date).toLocaleString('tr-TR')}\n\n`;
        });

        await interaction.reply({
            content: text,
            ephemeral: true
        });
    }
};
