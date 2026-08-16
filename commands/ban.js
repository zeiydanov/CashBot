const { sendLog } = require('../utils/logger');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir üyeyi sunucudan yasaklar.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Yasaklanacak üye')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Yasaklama sebebi')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (member && !member.bannable) {
            return interaction.reply({
                content: '❌ Bu üyeyi yasaklayamıyorum. Rol hiyerarşisini kontrol et.',
                ephemeral: true
            });
        }

        await interaction.guild.members.ban(user.id, {
            reason: reason
        });
await sendLog(interaction.client, {
    action: 'BAN',
    user,
    moderator: interaction.user,
    reason
});
        await interaction.reply(
            `🔨 **${user.tag}** sunucudan yasaklandı.\n📝 Sebep: **${reason}**`
        );
    }
};