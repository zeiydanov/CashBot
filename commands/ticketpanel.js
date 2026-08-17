const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Ticket panelini oluşturur.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        // ==========================================
        // SADECE YÖNETİCİ
        // ==========================================

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content: '❌ Bu komutu sadece yöneticiler kullanabilir.',
                ephemeral: true
            });
        }

        // ==========================================
        // SUNUCU KONTROL
        // ==========================================

        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Bu komut sadece sunucularda kullanılabilir.',
                ephemeral: true
            });
        }

        // ==========================================
        // BOT İZNİ
        // ==========================================

        const botMember =
            interaction.guild.members.me;

        if (!botMember) {
            return interaction.reply({
                content: '❌ Bot sunucu bilgilerine ulaşamadı.',
                ephemeral: true
            });
        }

        if (
            !botMember.permissions.has(
                PermissionFlagsBits.SendMessages
            )
        ) {
            return interaction.reply({
                content:
                    '❌ Botun bu kanalda **Mesaj Gönder** izni yok.',
                ephemeral: true
            });
        }

        // ==========================================
        // MEVCUT PANEL KONTROLÜ
        // ==========================================

        const existingPanel =
            interaction.channel.messages.cache.find(
                message => {

                    if (
                        message.author.id !==
                        interaction.client.user.id
                    ) {
                        return false;
                    }

                    if (
                        !message.embeds ||
                        message.embeds.length === 0
                    ) {
                        return false;
                    }

                    const embed =
                        message.embeds[0];

                    return (
                        embed.title ===
                        '🎫 CashBot Destek Merkezi'
                    );
                }
            );

        // ==========================================
        // PANEL ZATEN VARSA
        // ==========================================

        if (existingPanel) {

            return interaction.reply({
                content:
                    `⚠️ Bu kanalda zaten bir Ticket paneli bulunuyor.\n\n` +
                    `📌 Mevcut panel: ${existingPanel}`,
                ephemeral: true
            });
        }

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(0x5865F2)

                .setTitle(
                    '🎫 CashBot Destek Merkezi'
                )

                .setDescription(

                    'Aşağıdaki kategorilerden size uygun olanı seçerek destek talebi oluşturabilirsiniz.\n\n' +

                    '💬 **Destek Talebi**\n' +
                    'Genel yardım ve sorularınız için.\n\n' +

                    '💰 **Donate**\n' +
                    'Donate işlemleri ve satın alımlar için.\n\n' +

                    '🚨 **Şikayet**\n' +
                    'Oyuncu veya sunucu şikayetleri için.\n\n' +

                    '🛠️ **Teknik Destek**\n' +
                    'Teknik sorunlar ve bağlantı problemleri için.\n\n' +

                    '━━━━━━━━━━━━━━━━━━━━\n\n' +

                    '📌 **Nasıl Ticket Açılır?**\n' +
                    'Size uygun butona basın. CashBot sizin için özel bir ticket kanalı oluşturacaktır.\n\n' +

                    '🔒 Ticket kanallarını yalnızca siz ve yetkili ekip görebilir.'
                )

                .setFooter({
                    text:
                        'CashBot • Destek Sistemi'
                })

                .setTimestamp();

        // ==========================================
        // BUTONLAR
        // ==========================================

        const row =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            'ticket_destek'
                        )
                        .setLabel(
                            'Destek Talebi'
                        )
                        .setEmoji('💬')
                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            'ticket_donate'
                        )
                        .setLabel(
                            'Donate'
                        )
                        .setEmoji('💰')
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            'ticket_sikayet'
                        )
                        .setLabel(
                            'Şikayet'
                        )
                        .setEmoji('🚨')
                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            'ticket_teknik'
                        )
                        .setLabel(
                            'Teknik Destek'
                        )
                        .setEmoji('🛠️')
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                );

        // ==========================================
        // PANEL GÖNDER
        // ==========================================

        try {

            const panelMessage =
                await interaction.channel.send({

                    embeds: [
                        embed
                    ],

                    components: [
                        row
                    ]

                });

            // ======================================
            // BAŞARILI
            // ======================================

            return interaction.reply({

                content:
                    `✅ Ticket paneli başarıyla oluşturuldu.\n\n` +
                    `📌 Panel: ${panelMessage}`,

                ephemeral: true

            });

        } catch (error) {

            console.error(
                '❌ TICKET PANEL OLUŞTURMA HATASI:',
                error
            );

            return interaction.reply({

                content:
                    '❌ Ticket paneli oluşturulamadı.\n\n' +
                    `🔧 Hata: \`${error.code || error.message}\``,

                ephemeral: true

            });
        }
    }
};