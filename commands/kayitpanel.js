const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('kayitpanel')

        .setDescription(
            'Mülakat kayıt panelini gönderir.'
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        try {

            // ==========================================
            // SUNUCU KONTROL
            // ==========================================

            if (!interaction.guild) {

                return interaction.reply({

                    content:
                        '❌ Bu komut sadece sunucularda kullanılabilir.',

                    ephemeral: true

                });
            }


            // ==========================================
            // EMBED
            // ==========================================

            const embed = new EmbedBuilder()

                .setColor(0x5865F2)

                .setTitle(
                    '📋 OLD RP Kayıt Başvurusu'
                )

                .setDescription(

                    'Sunucumuza katılmak için aşağıdaki **Kayıt Ol** butonuna bas.\n\n' +

                    'Başvuru formunda aşağıdaki bilgiler istenecektir:\n\n' +

                    '👤 **İsim / Soyisim**\n' +
                    '🎂 **Yaş**\n' +
                    '🎮 **FiveM / Oyun ID**\n' +
                    '🕐 **Günlük Aktiflik**\n' +
                    '🎙️ **Mikrofon Durumu**\n' +
                    '📜 **RP Deneyimi**\n\n' +

                    'Başvurun oluşturulduktan sonra kayıt yetkilileri seninle ilgilenecektir.'

                )

                .setFooter({

                    text:
                        'CashBot • Kayıt Sistemi'

                })

                .setTimestamp();


            // ==========================================
            // BUTON
            // ==========================================

            const row = new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'kayit_baslat'
                        )

                        .setLabel(
                            'Kayıt Ol'
                        )

                        .setEmoji(
                            '📋'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        )

                );


            // ==========================================
            // PANEL GÖNDER
            // ==========================================

            await interaction.channel.send({

                embeds: [
                    embed
                ],

                components: [
                    row
                ]

            });


            // ==========================================
            // KOMUT CEVABI
            // ==========================================

            return interaction.reply({

                content:
                    '✅ Kayıt paneli başarıyla oluşturuldu.',

                ephemeral: true

            });

        } catch (error) {

            console.error(
                '❌ KAYIT PANEL HATASI:',
                error
            );


            if (
                interaction.replied ||
                interaction.deferred
            ) {

                return interaction.followUp({

                    content:
                        '❌ Kayıt paneli oluşturulurken hata oluştu.',

                    ephemeral: true

                });

            }


            return interaction.reply({

                content:
                    '❌ Kayıt paneli oluşturulurken hata oluştu.',

                ephemeral: true

            });

        }

    }

};