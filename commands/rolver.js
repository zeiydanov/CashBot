const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolver')
        .setDescription('Bir kullanıcıya rol verir.')
        .addUserOption(option =>
            option
                .setName('kişi')
                .setDescription('Rol verilecek kişi')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('rol')
                .setDescription('Verilecek rol')
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
                content: '❌ Bu rol Discord tarafından yönetiliyor ve verilemez.',
                ephemeral: true
            });
        }

        if (rol.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ Bu rol benim en yüksek rolümün altında olmalı.',
                ephemeral: true
            });
        }

        if (kişi.roles.cache.has(rol.id)) {
            return interaction.reply({
                content: `⚠️ ${kişi} kullanıcısında **${rol.name}** rolü zaten bulunuyor.`,
                ephemeral: true
            });
        }

        try {
            await kişi.roles.add(rol);

            await interaction.reply({
                content: `✅ ${kişi} kullanıcısına **${rol.name}** rolü verildi.`
            });

        } catch (error) {
            console.error('Rol verme hatası:', error);

            await interaction.reply({
                content: '❌ Rol verilirken bir hata oluştu.',
                ephemeral: true
            });
        }
    }
};