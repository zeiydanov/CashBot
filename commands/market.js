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
// ÜRÜN FİYATLARI
// ==========================================

const PRICES = {
    vip: 50000,
    surprise: 150000,
    special: 250000
};

// ==========================================
// ECONOMY KLASÖRÜ
// ==========================================

function ensureDataFile() {

    const dataFolder = path.dirname(dataPath);

    if (!fs.existsSync(dataFolder)) {

        fs.mkdirSync(
            dataFolder,
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
}

// ==========================================
// VERİ YÜKLE
// ==========================================

function loadData() {

    ensureDataFile();

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
// VERİ KAYDET
// ==========================================

function saveData(data) {

    ensureDataFile();

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

function getUser(
    data,
    userId
) {

    if (!data[userId]) {

        data[userId] = {

            money: 0,

            xp: 0,

            lastDaily: 0

        };
    }

    if (
        typeof data[userId].money !== 'number'
    ) {

        data[userId].money =
            Number(
                data[userId].money
            ) || 0;
    }

    if (
        typeof data[userId].xp !== 'number'
    ) {

        data[userId].xp =
            Number(
                data[userId].xp
            ) || 0;
    }

    if (
        typeof data[userId].lastDaily !== 'number'
    ) {

        data[userId].lastDaily = 0;
    }

    return data[userId];
}

// ==========================================
// MARKET KOMUTU
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('market')

        .setDescription(
            'Cash Market mağazasını aç.'
        ),

    // ==========================================
    // MARKET AÇ
    // ==========================================

    async execute(interaction) {

        const data =
            loadData();

        const userData =
            getUser(
                data,
                interaction.user.id
            );

        const embed =
            new EmbedBuilder()

                .setColor(
                    0x5865F2
                )

                .setTitle(
                    '🛒 CASH MARKET'
                )

                .setDescription(

                    '💰 **Cash bakiyeni kullanarak aşağıdaki ürünleri satın alabilirsin.**\n\n' +

                    '💎 **VIP Rol**\n' +
                    '`50.000 Cash`\n' +
                    'Satın aldığında VIP rolün otomatik olarak verilir.\n\n' +

                    '🎁 **Sürpriz Ödül**\n' +
                    '`150.000 Cash`\n' +
                    '**SÜRPRİZ ÖDÜL KAZANMA ŞANSI!**\n\n' +

                    '⭐ **Özel Ödül**\n' +
                    '`250.000 Cash`\n' +
                    '**Satın aldıktan sonra ekran görüntüsünü al ve #cash-ticket üzerinden özel rolünü talep et!**\n\n' +

                    '━━━━━━━━━━━━━━━━━━━━\n\n' +

                    '💵 **Mevcut Bakiyen:** `' +
                    userData.money.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n\n' +

                    '⚠️ Satın alma işlemi yapıldığında Cash bakiyenden otomatik olarak düşülür.'

                )

                .setFooter({

                    text:
                        'CashBot • Cash Market'

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
                            'market_vip'
                        )

                        .setLabel(
                            'VIP Rol • 50.000'
                        )

                        .setEmoji(
                            '💎'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_surprise'
                        )

                        .setLabel(
                            'Sürpriz • 150.000'
                        )

                        .setEmoji(
                            '🎁'
                        )

                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()

                        .setCustomId(
                            'market_special'
                        )

                        .setLabel(
                            'Özel Ödül • 250.000'
                        )

                        .setEmoji(
                            '⭐'
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        )

                );

        await interaction.reply({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });
    },

    // ==========================================
    // SATIN ALMA FONKSİYONU
    // ==========================================

    async purchase(
        interaction,
        product
    ) {

        const price =
            PRICES[product];

        if (!price) {

            return interaction.reply({

                content:
                    '❌ Geçersiz market ürünü.',

                ephemeral: true

            });
        }

        const data =
            loadData();

        const userData =
            getUser(
                data,
                interaction.user.id
            );

        // ==========================================
        // PARA KONTROL
        // ==========================================

        if (
            userData.money < price
        ) {

            return interaction.reply({

                content:

                    '❌ **Yeterli Cash bulunmuyor.**\n\n' +

                    '💰 Mevcut bakiyen: `' +
                    userData.money.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n' +

                    '💵 Ürün fiyatı: `' +
                    price.toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`\n\n' +

                    '❗ Eksik Cash: `' +
                    (
                        price -
                        userData.money
                    ).toLocaleString(
                        'tr-TR'
                    ) +
                    ' Cash`',

                ephemeral: true

            });
        }

        // ==========================================
        // VIP
        // ==========================================

        if (
            product === 'vip'
        ) {

            const roleId =
                process.env.VIP_ROLE_ID;

            if (!roleId) {

                return interaction.reply({

                    content:
                        '❌ VIP rolü ayarlanmamış. `.env` dosyasına `VIP_ROLE_ID` ekle.',

                    ephemeral: true

                });
            }

            const role =
                interaction.guild.roles.cache.get(
                    roleId
                );

            if (!role) {

                return interaction.reply({

                    content:
                        '❌ VIP rolü sunucuda bulunamadı.',

                    ephemeral: true

                });
            }

            if (
                interaction.member.roles.cache.has(
                    roleId
                )
            ) {

                return interaction.reply({

                    content:
                        '❌ Zaten VIP rolüne sahipsin.',

                    ephemeral: true

                });
            }

            // ==========================================
            // ROLÜ VER
            // ==========================================

            try {

                await interaction.member.roles.add(
                    role
                );

            } catch (error) {

                console.error(
                    '❌ VIP rolü verilemedi:',
                    error
                );

                return interaction.reply({

                    content:
                        '❌ VIP rolü verilemedi. Botun rolünün VIP rolünden yukarıda olduğundan emin ol.',

                    ephemeral: true

                });
            }

            // ==========================================
            // PARA DÜŞ
            // ==========================================

            userData.money -= price;

            saveData(data);

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0xF1C40F
                    )

                    .setTitle(
                        '💎 VIP SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '💎 **VIP rolün başarıyla verildi!**\n\n' +

                        '💸 Ödenen: `' +
                        price.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`\n' +

                        '💰 Kalan bakiyen: `' +
                        userData.money.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`'

                    )

                    .setFooter({

                        text:
                            'CashBot • Cash Market'

                    })

                    .setTimestamp();

            return interaction.reply({

                embeds: [
                    embed
                ],

                ephemeral: true

            });
        }

        // ==========================================
        // SÜRPRİZ ÖDÜL
        // ==========================================

        if (
            product === 'surprise'
        ) {

            userData.money -= price;

            saveData(data);

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0x9B59B6
                    )

                    .setTitle(
                        '🎁 SÜRPRİZ ÖDÜL SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '🎁 **Sürpriz ödülünü satın aldın!**\n\n' +

                        '🚗 **Boss veya OG\'nin garajındaki 1 araca talip olabilirsin!**\n\n' +

                        '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

                        '🎫 Daha sonra **#cash-ticket** üzerinden ödülünü talep et.\n\n' +

                        '💸 Ödenen: `' +
                        price.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`\n' +

                        '💰 Kalan bakiyen: `' +
                        userData.money.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`'

                    )

                    .setFooter({

                        text:
                            'CashBot • Sürpriz Ödül'

                    })

                    .setTimestamp();

            return interaction.reply({

                embeds: [
                    embed
                ],

                ephemeral: true

            });
        }

        // ==========================================
        // ÖZEL ÖDÜL
        // ==========================================

        if (
            product === 'special'
        ) {

            userData.money -= price;

            saveData(data);

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0xE74C3C
                    )

                    .setTitle(
                        '⭐ ÖZEL ÖDÜL SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '⭐ **Özel ödül satın alma işlemin başarıyla tamamlandı.**\n\n' +

                        '📸 **Bu ekranın görüntüsünü al!**\n\n' +

                        '🎫 **#cash-ticket** üzerinden özel rolünü talep et.\n\n' +

                        '💸 Ödenen: `' +
                        price.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`\n' +

                        '💰 Kalan bakiyen: `' +
                        userData.money.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`'

                    )

                    .setFooter({

                        text:
                            'CashBot • Özel Ödül'

                    })

                    .setTimestamp();

            return interaction.reply({

                embeds: [
                    embed
                ],

                ephemeral: true

            });
        }
    }
};