const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('zar')

        .setDescription(
            'Şansını dene ve zar at!'
        )

        .setDefaultMemberPermissions(null)

        .addIntegerOption(option =>

            option
                .setName('adet')

                .setDescription(
                    'Atılacak zar sayısı (1-10)'
                )

                .setMinValue(1)

                .setMaxValue(10)

                .setRequired(false)

        ),

    async execute(interaction) {

        // ==========================================
        // ZAR ADEDİ
        // ==========================================

        const adet =
            interaction.options.getInteger(
                'adet'
            ) || 1;

        // ==========================================
        // ZARLARI AT
        // ==========================================

        const zarlar = [];

        for (
            let i = 0;
            i < adet;
            i++
        ) {

            zarlar.push(
                Math.floor(
                    Math.random() * 6
                ) + 1
            );

        }

        // ==========================================
        // TOPLAM
        // ==========================================

        const toplam =
            zarlar.reduce(
                (sum, zar) =>
                    sum + zar,
                0
            );

        // ==========================================
        // ZAR SONUÇLARI
        // ==========================================

        const sonuc =
            zarlar
                .map(
                    (zar, index) =>

                        `🎲 **Zar ${
                            index + 1
                        }:** \`${zar}\``

                )
                .join('\n');

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x5865F2
                )

                .setTitle(
                    '🎲 CASHBOT ZAR'
                )

                .setDescription(

                    '👤 **Oyuncu:** ' +
                    interaction.user +
                    '\n\n' +

                    sonuc +
                    '\n\n' +

                    '━━━━━━━━━━━━━━━━━━\n\n' +

                    '➕ **Toplam:** `' +
                    toplam +
                    '`'

                )

                .addFields(

                    {
                        name:
                            '🎲 Zar Sayısı',

                        value:
                            '`' +
                            adet +
                            '`',

                        inline: true
                    },

                    {
                        name:
                            '🔢 Olası Maksimum',

                        value:
                            '`' +
                            (adet * 6) +
                            '`',

                        inline: true
                    }

                )

                .setThumbnail(
                    interaction.user
                        .displayAvatarURL({
                            size: 256
                        })
                )

                .setFooter({

                    text:
                        'CashBot • Zar Sistemi'

                })

                .setTimestamp();

        // ==========================================
        // CEVAP
        // ==========================================

        await interaction.reply({

            embeds: [
                embed
            ]

        });

    }

};