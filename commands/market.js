const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const economy = require('../utils/economy');

// ==========================================
// MARKET FİYATLARI
// ==========================================

const PRICES = {
    vip: 50000,
    weed: 100000,
    surprise: 200000,
    vehicle: 1000000,
    fight: 500000,
    special: 250000
};

// ==========================================
// MARKET
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('market')

        .setDescription(
            'Cash Market mağazasını aç.'
        ),

    async execute(interaction) {

        const balance =
            economy.getBalance(
                interaction.user.id
            );

        // ==========================================
        // EMBED
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(0x5865F2)

                .setTitle(
                    '🛒 CASH MARKET'
                )

                .setDescription(

                    '💰 **Cash bakiyeni kullanarak aşağıdaki ürünleri satın alabilirsin.**\n\n' +

                    '💎 **VIP Rol**\n' +
                    '`50.000 Cash`\n' +
                    'Satın aldığında VIP rolün otomatik olarak verilir.\n\n' +

                    '🌿 **Weed Permi**\n' +
                    '`100.000 Cash`\n' +
                    'Satın aldığında Weed Permi rolün otomatik olarak verilir.\n\n' +

                    '🎁 **Sürpriz Ödül**\n' +
                    '`200.000 Cash`\n' +
                    'Boss / OG garajından ödül talep etme hakkı kazanırsın.\n\n' +

                    '🚗 **Araç Ödülü**\n' +
                    '`1.000.000 Cash`\n' +
                    'Galeriden **1 adet araç seçme** hakkı kazanırsın.\n\n' +

                    '🔫 **FiveM Fight Paketi**\n' +
                    '`500.000 Cash`\n' +
                    '🔫 1 Silah\n' +
                    '💥 100 Mermi\n' +
                    '🩹 10 Bandaj\n' +
                    '🛡️ 10 Zırh\n\n' +

                    '⭐ **Özel Rol**\n' +
                    '`250.000 Cash`\n' +
                    'Özel rolünü talep etme hakkı kazanırsın.\n\n' +

                    '━━━━━━━━━━━━━━━━━━━━\n\n' +

                    '💵 **Mevcut Bakiyen:** `' +
                    balance.toLocaleString('tr-TR') +
                    ' Cash`\n\n' +

                    '⚠️ Satın alma işlemi tamamlandığında Cash bakiyenden otomatik olarak düşülür.'

                )

                .setFooter({
                    text:
                        'CashBot • Cash Market'
                })

                .setTimestamp();

        // ==========================================
        // 1. SATIR
        // ==========================================

        const row1 =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'market_vip'
                        )

                        .setLabel(
                            'VIP • 50K'
                        )

                        .setEmoji(
                            '💎'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_weed'
                        )

                        .setLabel(
                            'Weed • 100K'
                        )

                        .setEmoji(
                            '🌿'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_surprise'
                        )

                        .setLabel(
                            'Sürpriz • 200K'
                        )

                        .setEmoji(
                            '🎁'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                );

        // ==========================================
        // 2. SATIR
        // ==========================================

        const row2 =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'market_vehicle'
                        )

                        .setLabel(
                            'Araç • 1M'
                        )

                        .setEmoji(
                            '🚗'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_fight'
                        )

                        .setLabel(
                            'Fight Paketi • 500K'
                        )

                        .setEmoji(
                            '🔫'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_special'
                        )

                        .setLabel(
                            'Özel Rol • 250K'
                        )

                        .setEmoji(
                            '⭐'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                );

        // ==========================================
        // GÖNDER
        // ==========================================

        return interaction.reply({

            embeds: [
                embed
            ],

            components: [
                row1,
                row2
            ]

        });
    }
};