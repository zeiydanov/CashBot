const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolal')
        .setDescription('Bir kullanıcıdan rol alır.')
        .addUserOption(option =>
            option
                .setName('kişi')
                .setDescription('Rolü alınacak kişi')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rol')
                .setDescription('Alınacak rol')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const kişi = interaction.options.getMember('kişi');
        const rol = interaction.options.getRole('rol');

        if (!kişi) {
            return interaction.reply({
                content: '❌ Kullanıcı bulunamadı.',
                ephemeral: true
            });
        }

        if (!rol) {
            return interaction.reply({
                content: '❌ Rol bulunamadı.',
                ephemeral: true
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ Botun **Rolleri Yönet** yetkisi bulunmuyor.',
                ephemeral: true
            });
        }

        if (rol.managed) {
            return interaction.reply({
                content: '❌ Bu rol Discord tarafından yönetiliyor ve alınamaz.',
                ephemeral: true
            });
        }

        if (rol.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ Bu rol benim en yüksek rolümün altında olmalı.',
                ephemeral: true
            });
        }

        if (!kişi.roles.cache.has(rol.id)) {
            return interaction.reply({
                content: `⚠️ ${kişi} kullanıcısında **${rol.name}** rolü bulunmuyor.`,
                ephemeral: true
            });
        }

        try {
            await kişi.roles.remove(rol);

            await interaction.reply({
                content: `✅ ${kişi} kullanıcısından **${rol.name}** rolü alındı.`
            });

        } catch (error) {
            console.error('Rol alma hatası:', error);

            await interaction.reply({
                content: '❌ Rol alınırken bir hata oluştu.',
                ephemeral: true
            });
        }
    }
};