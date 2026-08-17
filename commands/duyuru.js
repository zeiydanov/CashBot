const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Bulunduğun sunucunun duyuru kanalına @everyone ile duyuru gönderir.')
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

        // ==========================================
        // SUNUCU KONTROL
        // ==========================================

        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Bu komut sadece sunucularda kullanılabilir.',
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;

        // ==========================================
        // SUNUCUYA GÖRE DUYURU KANALI
        // ==========================================

        let channelId = null;

        // 1. SUNUCU
        if (guildId === process.env.GUILD_ID) {

            channelId =
                process.env.ANNOUNCEMENT_CHANNEL_ID;

        }

        // 2. SUNUCU
        else if (guildId === process.env.GUILD_ID_2) {

            channelId =
                process.env.ANNOUNCEMENT_CHANNEL_ID_2;

        }

        // TANIMSIZ SUNUCU
        else {

            return interaction.reply({
                content:
                    '❌ Bu sunucu CashBot tarafından yapılandırılmamış.',
                ephemeral: true
            });
        }

        // ==========================================
        // CHANNEL ID KONTROL
        // ==========================================

        if (!channelId) {

            return interaction.reply({
                content:
                    '❌ Bu sunucu için duyuru kanalı yapılandırılmamış.\n\n' +
                    '🔧 `.env` dosyasındaki duyuru kanal ID\'sini kontrol et.',
                ephemeral: true
            });
        }

        // ==========================================
        // KANALI BUL
        // ==========================================

        const announcementChannel =
            await interaction.client.channels
                .fetch(channelId)
                .catch(() => null);

        if (!announcementChannel) {

            return interaction.reply({
                content:
                    '❌ Bu sunucunun duyuru kanalı bulunamadı.\n\n' +
                    `🆔 Kanal ID: \`${channelId}\``,
                ephemeral: true
            });
        }

        // ==========================================
        // KANALIN AYNI SUNUCUDA OLDUĞUNU KONTROL ET
        // ==========================================

        if (
            announcementChannel.guildId !== guildId
        ) {

            console.error(
                '❌ DUYURU KANALI SUNUCU UYUŞMAZLIĞI'
            );

            console.error(
                `Komut Sunucusu: ${guildId}`
            );

            console.error(
                `Kanal Sunucusu: ${announcementChannel.guildId}`
            );

            return interaction.reply({
                content:
                    '❌ Duyuru kanalı başka bir sunucuya ait görünüyor. `.env` ayarlarını kontrol et.',
                ephemeral: true
            });
        }

        // ==========================================
        // MESAJ
        // ==========================================

        const message =
            interaction.options.getString('mesaj');

        // ==========================================
        // DUYURU GÖNDER
        // ==========================================

        try {

            await announcementChannel.send({

                content:
                    `@everyone\n\n` +
                    `📢 **DUYURU**\n\n` +
                    `${message}`,

                allowedMentions: {
                    parse: ['everyone']
                }

            });

            console.log(
                `📢 Duyuru gönderildi | ${interaction.guild.name} | ${announcementChannel.name}`
            );

            return interaction.reply({
                content:
                    `✅ Duyuru başarıyla gönderildi.\n\n` +
                    `📢 **Kanal:** ${announcementChannel}`,
                ephemeral: true
            });

        } catch (error) {

            console.error(
                '❌ Duyuru gönderme hatası:',
                error
            );

            return interaction.reply({
                content:
                    '❌ Duyuru gönderilemedi.\n\n' +
                    'Botun bu kanalda **Mesaj Gönder** ve **@everyone Etiketle** yetkilerini kontrol et.',
                ephemeral: true
            });
        }
    }
};