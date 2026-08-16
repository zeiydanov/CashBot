const { sendLog } = require('../utils/logger');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Bir üyeye timeout uygular.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Timeout uygulanacak üye')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('dakika')
                .setDescription('Timeout süresi')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Timeout sebebi')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');
        const dakika = interaction.options.getInteger('dakika');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({
                content: '❌ Üye bulunamadı.',
                ephemeral: true
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                content: '❌ Bu üyeye timeout uygulayamıyorum.',
                ephemeral: true
            });
        }

        await member.timeout(dakika * 60 * 1000, reason);
await sendLog(interaction.client, {
    action: 'TIMEOUT',
    user,
    moderator: interaction.user,
    reason,
    details: `Süre: ${dakika} dakika`
});
        await interaction.reply(
            `🔇 **${user.tag}** ${dakika} dakika susturuldu.\n📝 Sebep: **${reason}**`
        );
    }
};