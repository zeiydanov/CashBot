const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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
// AKTİF ZAR SAVAŞLARI
// ==========================================

const activeBattles = new Map();

// ==========================================
// VERİ YÜKLE
// ==========================================

function loadData() {

    if (!fs.existsSync(path.dirname(dataPath))) {

        fs.mkdirSync(
            path.dirname(dataPath),
            {
                recursive: true
            }
        );
    }

    if (!fs.existsSync(dataPath)) {

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
            '❌ Economy okuma hatası:',
            error
        );

        return {};
    }
}

// ==========================================
// VERİ KAYDET
// ==========================================

function saveData(data) {

    fs.writeFileSync(
        dataPath,
        JSON.stringify(
            data,
            null,
            4
        )
    );
}

// ==========================================
// KULLANICI VERİSİ
// ==========================================

function getUser(data, id) {

    if (!data[id]) {

        data[id] = {
            money: 0,
            xp: 0,
            lastDaily: 0
        };

    }

    if (
        typeof data[id].money !== 'number'
    ) {

        data[id].money =
            Number(data[id].money) || 0;

    }

    if (
        typeof data[id].xp !== 'number'
    ) {

        data[id].xp =
            Number(data[id].xp) || 0;

    }

    if (
        typeof data[id].lastDaily !== 'number'
    ) {

        data[id].lastDaily = 0;

    }

    return data[id];
}

// ==========================================
// KOMUT
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('zar-savas')

        .setDescription(
            'Bir kullanıcıya Cash bahisli zar savaşı teklif eder.'
        )

        .setDefaultMemberPermissions(null)

        .addUserOption(option =>
            option
                .setName('rakip')
                .setDescription(
                    'Zar savaşına davet edeceğin kişi.'
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('bahis')
                .setDescription(
                    'Bahis miktarı Cash.'
                )
                .setRequired(true)
                .setMinValue(1)
        ),

    // ==========================================
    // KOMUT ÇALIŞTIR
    // ==========================================

    async execute(interaction) {

        const challenger =
            interaction.user;

        const opponent =
            interaction.options.getUser(
                'rakip'
            );

        const bet =
            interaction.options.getInteger(
                'bahis'
            );

        // ==========================================
        // KONTROLLER
        // ==========================================

        if (
            challenger.id === opponent.id
        ) {

            return interaction.reply({

                content:
                    '❌ Kendine zar savaşı açamazsın.',

                ephemeral: true

            });

        }

        if (opponent.bot) {

            return interaction.reply({

                content:
                    '❌ Botlara zar savaşı açamazsın.',

                ephemeral: true

            });

        }

        if (
            activeBattles.has(
                challenger.id
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Zaten aktif bir zar savaşı teklifin var.',

                ephemeral: true

            });

        }

        if (
            activeBattles.has(
                opponent.id
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Bu kullanıcının zaten aktif bir zar savaşı teklifi bulunuyor.',

                ephemeral: true

            });

        }

        // ==========================================
        // EKONOMİ
        // ==========================================

        const data =
            loadData();

        const challengerData =
            getUser(
                data,
                challenger.id
            );

        if (
            challengerData.money < bet
        ) {

            return interaction.reply({

                content:

                    '❌ **Yeterli Cash bulunmuyor.**\n\n' +

                    '💰 Bakiyen: `' +
                    challengerData.money.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n' +

                    '🎲 Bahis: `' +
                    bet.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`',

                ephemeral: true

            });

        }

        // ==========================================
        // BATTLE ID
        // ==========================================

        const battleId =
            challenger.id +
            '_' +
            opponent.id +
            '_' +
            Date.now();

        // ==========================================
        // SAVAŞ KAYDI
        // ==========================================

        const battle = {

            id: battleId,

            challengerId:
                challenger.id,

            opponentId:
                opponent.id,

            bet:
                bet,

            createdAt:
                Date.now(),

            expiresAt:
                Date.now() + 60000,

            accepted:
                false

        };

        activeBattles.set(
            battleId,
            battle
        );

        // Kullanıcıların aktif savaşı
        activeBattles.set(
            challenger.id,
            battleId
        );

        activeBattles.set(
            opponent.id,
            battleId
        );

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(
                    0xFEE75C
                )

                .setTitle(
                    '🎲 ZAR SAVAŞI TEKLİFİ'
                )

                .setDescription(

                    '⚔️ **' +
                    challenger +
                    '** sana zar savaşı teklif etti!\n\n' +

                    '💰 **Bahis:** `' +
                    bet.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n\n' +

                    '🏆 **Toplam Ödül:** `' +
                    (bet * 2).toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n\n' +

                    '🎲 Kabul edersen iki taraf da zar atacak.\n' +

                    '🏆 Büyük atan oyuncu toplam bahsi kazanacak.\n\n' +

                    '⏰ **60 saniye içerisinde cevap vermelisin.**'

                )

                .addFields(

                    {
                        name:
                            '👤 Meydan Okuyan',

                        value:
                            challenger.toString(),

                        inline: true
                    },

                    {
                        name:
                            '🎯 Rakip',

                        value:
                            opponent.toString(),

                        inline: true
                    },

                    {
                        name:
                            '💵 Bahis',

                        value:
                            '`' +
                            bet.toLocaleString(
                                'tr-TR'
                            ) +
                            ' Cash`',

                        inline: true
                    }

                )

                .setFooter({

                    text:
                        'CashBot • Zar Savaşı'

                })

                .setTimestamp();

        // ==========================================
        // BUTONLAR
        // ==========================================

        const buttons =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'zar_kabul_' +
                            battleId
                        )

                        .setLabel(
                            'Kabul Et'
                        )

                        .setEmoji(
                            '✅'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'zar_reddet_' +
                            battleId
                        )

                        .setLabel(
                            'Reddet'
                        )

                        .setEmoji(
                            '❌'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )

                );

        // ==========================================
        // MESAJ
        // ==========================================

        await interaction.reply({

            content:
                opponent.toString(),

            embeds: [
                embed
            ],

            components: [
                buttons
            ]

        });

        // ==========================================
        // 60 SANİYE TIMEOUT
        // ==========================================

        setTimeout(
            async () => {

                const current =
                    activeBattles.get(
                        battleId
                    );

                if (!current) {
                    return;
                }

                if (
                    current.accepted
                ) {
                    return;
                }

                activeBattles.delete(
                    battleId
                );

                activeBattles.delete(
                    challenger.id
                );

                activeBattles.delete(
                    opponent.id
                );

                try {

                    await interaction.editReply({

                        content:
                            '⏰ Zar savaşı teklifi zaman aşımına uğradı.',

                        embeds: [],

                        components: []

                    });

                } catch (error) {

                    console.error(
                        '❌ Zar savaşı timeout hatası:',
                        error
                    );

                }

            },
            60000
        );

    },

    activeBattles

};