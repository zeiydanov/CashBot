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

        .setName('seviye')

        .setDescription(
            'XP ve seviyeni veya başka bir kullanıcının seviyesini gösterir.'
        )

        // NORMAL OYUNCULAR KULLANABİLİR
        .setDefaultMemberPermissions(null)

        .addUserOption(option =>

            option
                .setName('kullanici')

                .setDescription(
                    'Seviyesini görmek istediğin kişi.'
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
            // XP
            // ==========================================

            let xp = 0;

            if (data[user.id]) {

                xp =
                    Number(
                        data[user.id].xp
                    ) || 0;

            }

            // Negatif XP oluşmasını engelle
            if (xp < 0) {
                xp = 0;
            }

            // ==========================================
            // SEVİYE HESABI
            // ==========================================

            const level =
                Math.floor(
                    xp / 1000
                ) + 1;

            // Mevcut seviyedeki XP
            const currentLevelXp =
                xp % 1000;

            // Bir sonraki seviyeye kalan XP
            const remainingXp =
                1000 - currentLevelXp;

            // ==========================================
            // İLERLEME ÇUBUĞU
            // ==========================================

            let progress =
                Math.floor(
                    (currentLevelXp / 1000) * 10
                );

            if (progress < 0) {
                progress = 0;
            }

            if (progress > 10) {
                progress = 10;
            }

            const progressBar =
                '🟩'.repeat(progress) +
                '⬜'.repeat(
                    10 - progress
                );

            // ==========================================
            // YÜZDE
            // ==========================================

            const percentage =
                Math.floor(
                    (currentLevelXp / 1000) * 100
                );

            // ==========================================
            // EMBED
            // ==========================================

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0x5865F2
                    )

                    .setTitle(
                        '⭐ SEVİYE BİLGİSİ'
                    )

                    .setDescription(

                        '👤 **Kullanıcı:** ' +
                        user +
                        '\n\n' +

                        '🏆 **Seviye:** `' +
                        level +
                        '`' +
                        '\n' +

                        '⭐ **Toplam XP:** `' +
                        xp.toLocaleString(
                            'tr-TR'
                        ) +
                        ' XP`' +
                        '\n\n' +

                        '**Seviye İlerlemesi**' +
                        '\n' +

                        progressBar +
                        '\n' +

                        '`' +
                        percentage +
                        '%`' +
                        '\n\n' +

                        '📈 **Bu Seviye:** `' +
                        currentLevelXp.toLocaleString(
                            'tr-TR'
                        ) +
                        ' / 1000 XP`' +
                        '\n' +

                        '🎯 **Sonraki Seviyeye:** `' +
                        remainingXp.toLocaleString(
                            'tr-TR'
                        ) +
                        ' XP`'

                    )

                    .setThumbnail(

                        user.displayAvatarURL({
                            size: 256
                        })

                    )

                    .setFooter({

                        text:
                            'CashBot • XP Sistemi'

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
                '❌ SEVİYE KOMUTU HATASI:',
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        '❌ Seviye bilgisi alınırken bir hata oluştu.',

                    ephemeral: true

                });

            } else {

                await interaction.reply({

                    content:
                        '❌ Seviye bilgisi alınırken bir hata oluştu.',

                    ephemeral: true

                });

            }

        }

    }

};