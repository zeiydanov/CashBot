const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(
    __dirname,
    '..',
    'data',
    'economy.json'
);

// ==========================================
// VERİLERİ YÜKLE
// ==========================================

function loadData() {

    if (!fs.existsSync(dataPath)) {

        fs.mkdirSync(
            path.dirname(dataPath),
            {
                recursive: true
            }
        );

        fs.writeFileSync(
            dataPath,
            '{}'
        );
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                dataPath,
                'utf8'
            )
        );

    } catch (error) {

        console.error(
            '❌ Economy verisi okunamadı:',
            error
        );

        return {};
    }
}

// ==========================================
// KOMUT
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('bakiye')

        .setDescription(
            'Cash bakiyeni veya başka bir kullanıcının bakiyesini gösterir.'
        )

        // NORMAL OYUNCULAR KULLANABİLİR
        .setDefaultMemberPermissions(null)

        .addUserOption(option =>

            option
                .setName('kullanici')

                .setDescription(
                    'Bakiyesini görmek istediğin kişi.'
                )

                .setRequired(false)

        ),

    // ==========================================
    // ÇALIŞTIR
    // ==========================================

    async execute(interaction) {

        try {

            // ==========================================
            // KULLANICI
            // ==========================================

            const user =
                interaction.options.getUser(
                    'kullanici'
                ) ||
                interaction.user;

            // ==========================================
            // VERİLER
            // ==========================================

            const data =
                loadData();

            // ==========================================
            // BAKİYE
            // ==========================================

            let money = 0;

            if (data[user.id]) {

                money =
                    Number(
                        data[user.id].money
                    ) || 0;

            }

            // ==========================================
            // EMBED
            // ==========================================

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0x57F287
                    )

                    .setTitle(
                        '💰 CASH BAKİYESİ'
                    )

                    .setDescription(

                        '👤 **Kullanıcı:** ' +
                        user +
                        '\n\n' +

                        '💵 **Bakiye:**\n' +

                        '`' +
                        money.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`'

                    )

                    .setThumbnail(

                        user.displayAvatarURL({
                            size: 256
                        })

                    )

                    .setFooter({

                        text:
                            'CashBot • Ekonomi Sistemi'

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

        } catch (error) {

            console.error(
                '❌ BAKİYE KOMUTU HATASI:',
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        '❌ Bakiye bilgisi alınırken bir hata oluştu.',

                    ephemeral: true

                });

            } else {

                await interaction.reply({

                    content:
                        '❌ Bakiye bilgisi alınırken bir hata oluştu.',

                    ephemeral: true

                });

            }

        }

    }

};