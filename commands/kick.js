const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir üyeyi sunucudan atar.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Atılacak üye')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Atılma sebebi')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        if (!member) {
            return interaction.reply({
                content: '❌ Bu üye sunucuda bulunamadı.',
                ephemeral: true
            });
        }

        if (!member.kickable) {
            return interaction.reply({
                content: '❌ Bu üyeyi atamıyorum. Rol hiyerarşisini kontrol et.',
                ephemeral: true
            });
        }

        await member.kick(reason);

        await sendLog(interaction.client, {
            action: 'KICK',
            user,
            moderator: interaction.user,
            reason
        });

        await interaction.reply(
            `👢 **${user.tag}** sunucudan atıldı.\n📝 Sebep: **${reason}**`
        );
    }
};