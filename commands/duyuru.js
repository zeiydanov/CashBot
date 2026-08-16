const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Duyuru kanalına @everyone ile duyuru gönderir.')
        .addStringOption(option =>
            option
                .setName('mesaj')
                .setDescription('Gönderilecek duyuru mesajı')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    async execute(interaction) {

        const message = interaction.options.getString('mesaj');

        const channelId = process.env.ANNOUNCEMENT_CHANNEL_ID;

        if (!channelId) {
            return interaction.reply({
                content: '❌ ANNOUNCEMENT_CHANNEL_ID .env dosyasında bulunamadı.',
                ephemeral: true
            });
        }

        const announcementChannel =
            await interaction.client.channels
                .fetch(channelId)
                .catch(() => null);

        if (!announcementChannel) {
            return interaction.reply({
                content: '❌ Duyuru kanalı bulunamadı.',
                ephemeral: true
            });
        }

        try {

            await announcementChannel.send({
                content: `@everyone\n\n📢 **DUYURU**\n\n${message}`,
                allowedMentions: {
                    parse: ['everyone']
                }
            });

            await interaction.reply({
                content: '✅ Duyuru başarıyla gönderildi.',
                ephemeral: true
            });

        } catch (error) {

            console.error('❌ Duyuru gönderme hatası:', error);

            await interaction.reply({
                content:
                    '❌ Duyuru gönderilemedi. Botun kanalda mesaj gönderme ve @everyone etiketleme yetkisini kontrol et.',
                ephemeral: true
            });
        }
    }
};