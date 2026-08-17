require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    Client,
    GatewayIntentBits,
    Collection,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

// ==========================================
// ECONOMY SİSTEMİ
// ==========================================

const economy = require('./utils/economy');

// ==========================================
// BOT CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// KOMUT SİSTEMİ
// ==========================================

client.commands = new Collection();

const commandsPath = path.join(
    __dirname,
    'commands'
);

if (fs.existsSync(commandsPath)) {

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {

        const filePath = path.join(
            commandsPath,
            file
        );

        try {

            const command = require(filePath);

            if (
                command.data &&
                command.execute
            ) {

                client.commands.set(
                    command.data.name,
                    command
                );

                console.log(
                    `✅ Komut yüklendi: /${command.data.name}`
                );

            } else {

                console.log(
                    `⚠️ ${file} dosyasında data veya execute eksik.`
                );
            }

        } catch (error) {

            console.error(
                `❌ Komut yüklenemedi: ${file}`
            );

            console.error(error);
        }
    }
}

// ==========================================
// ECONOMY CLIENT'A BAĞLA
// ==========================================

client.economy = economy;

// ==========================================
// ECONOMY KISA FONKSİYONLARI
// ==========================================

function getUserBalance(userId) {

    return economy.getBalance(
        userId
    );
}

function addUserMoney(
    userId,
    amount
) {

    return economy.addMoney(
        userId,
        amount
    );
}

function removeUserMoney(
    userId,
    amount
) {

    return economy.removeMoney(
        userId,
        amount
    );
}

// ==========================================
// CASH MARKET ÜRÜNLERİ
// ==========================================

const MARKET_PRICES = {

    vip: 50000,

    weed: 100000,

    surprise: 200000,

    vehicle: 1000000,

    fight: 500000,

    special: 250000

};

// ==========================================
// ÜRÜN İSİMLERİ
// ==========================================

const MARKET_NAMES = {

    vip:
        '💎 VIP Rol',

    weed:
        '🌿 Weed Permi',

    surprise:
        '🎁 Sürpriz Ödül',

    vehicle:
        '🚗 Araç Ödülü',

    fight:
        '🔫 FiveM Fight Paket',

    special:
        '⭐ Özel Rol'

};

// ==========================================
// PARA FORMAT
// ==========================================

function formatMoney(amount) {

    return Number(amount).toLocaleString(
        'tr-TR'
    );
}

// ==========================================
// BOT HAZIR
// ==========================================

client.once(
    'clientReady',
    function() {

        console.log(
            '================================='
        );

        console.log(
            `🤖 ${client.user.tag} aktif!`
        );

        console.log(
            '📦 Komut sayısı: ' +
            client.commands.size
        );

        console.log(
            '🏠 Sunucu sayısı: ' +
            client.guilds.cache.size
        );

        console.log(
            '👥 Guild Members Intent: AKTİF'
        );

        console.log(
            '💰 Economy System: AKTİF'
        );

        console.log(
            '🛒 Cash Market: AKTİF'
        );

        console.log(
            '💎 VIP: 50.000'
        );

        console.log(
            '🌿 Weed Permi: 100.000'
        );

        console.log(
            '🎁 Sürpriz Ödül: 200.000'
        );

        console.log(
            '🚗 Araç Ödülü: 1.000.000'
        );

        console.log(
            '🔫 FiveM Fight Paket: 500.000'
        );

        console.log(
            '⭐ Özel Rol: 250.000'
        );

        console.log(
            '🎲 Zar Savaşı: AKTİF'
        );

        console.log(
            '================================='
        );

    }
);

// ==========================================
// INTERACTION
// ==========================================

client.on(
    'interactionCreate',
    async function(interaction) {

        // ==========================================
        // BUTONLAR
        // ==========================================

        if (interaction.isButton()) {

            // ==========================================
            // ZAR
            // ==========================================

            if (
                interaction.customId.startsWith('zar_kabul_') ||
                interaction.customId.startsWith('zar_reddet_')
            ) {

                await handleDiceBattle(
                    interaction
                );

                return;
            }

            // ==========================================
            // MARKET
            // ==========================================

            if (
                interaction.customId.startsWith('market_')
            ) {

                await handleMarketButton(
                    interaction
                );

                return;
            }

            // ==========================================
            // TICKET
            // ==========================================

            if (
                interaction.customId.startsWith('ticket_')
            ) {

                await handleTicketButton(
                    interaction
                );

                return;
            }
        }

        // ==========================================
        // SLASH COMMAND
        // ==========================================

        if (
            !interaction.isChatInputCommand()
        ) {

            return;
        }

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) {

            return;
        }

        try {

            await command.execute(
                interaction
            );

        } catch (error) {

            console.error(
                '❌ Komut hatası:',
                error
            );

            try {

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.followUp({

                        content:
                            '❌ Komut çalıştırılırken bir hata oluştu.',

                        ephemeral: true

                    });

                } else {

                    await interaction.reply({

                        content:
                            '❌ Komut çalıştırılırken bir hata oluştu.',

                        ephemeral: true

                    });
                }

            } catch (replyError) {

                console.error(
                    '❌ Hata mesajı gönderilemedi:',
                    replyError
                );
            }
        }
    }
);

// ==========================================
// MARKET TALEP MESAJI
// ==========================================

async function createMarketClaim(
    interaction,
    product
) {

    const logChannelId =
        process.env.LOG_CHANNEL_ID;

    if (!logChannelId) {

        console.log(
            '⚠️ LOG_CHANNEL_ID bulunamadı. Talep mesajı gönderilemedi.'
        );

        return null;
    }

    const channel =
        interaction.guild.channels.cache.get(
            logChannelId
        );

    if (!channel) {

        console.log(
            '⚠️ LOG_CHANNEL_ID kanal olarak bulunamadı.'
        );

        return null;
    }

    const productName =
        MARKET_NAMES[product];

    const embed =
        new EmbedBuilder()

            .setColor(0xF1C40F)

            .setTitle(
                '🛒 CASH MARKET TALEBİ'
            )

            .setDescription(

                '📢 **Yeni bir Cash Market talebi oluşturuldu.**\n\n' +

                '👤 **Oyuncu:** ' +
                interaction.user +
                '\n' +

                '🆔 **ID:** `' +
                interaction.user.id +
                '`\n\n' +

                '🛍️ **Ürün:** ' +
                productName +
                '\n' +

                '💰 **Ödenen:** `' +
                formatMoney(
                    MARKET_PRICES[product]
                ) +
                ' Cash`\n\n' +

                '🎫 **Talep durumu:** Yetkili teslimatı bekleniyor.\n\n' +

                '⚠️ Bu talep Cash Market satın alımı sonucunda otomatik oluşturulmuştur.'

            )

            .setFooter({

                text:
                    'CashBot • Market Talepleri'

            })

            .setTimestamp();

    try {

        const message =
            await channel.send({

                content:
                    '📦 **MARKET TALEBİ** <@' +
                    interaction.user.id +
                    '>',

                embeds: [
                    embed
                ]

            });

        return message;

    } catch (error) {

        console.error(
            '❌ Market talep mesajı gönderilemedi:',
            error
        );

        return null;
    }
}

// ==========================================
// MARKET SATIN ALMA BAŞARILI MESAJI
// ==========================================

function marketSuccessEmbed(
    interaction,
    product,
    balance
) {

    return new EmbedBuilder()

        .setColor(0x57F287)

        .setTitle(
            '🛒 MARKET SATIN ALIMI BAŞARILI!'
        )

        .setDescription(

            '🎉 Tebrikler ' +
            interaction.user +
            '!\n\n' +

            '🛍️ **Ürün:** ' +
            MARKET_NAMES[product] +
            '\n\n' +

            '💰 **Ödenen:** `' +
            formatMoney(
                MARKET_PRICES[product]
            ) +
            ' Cash`\n\n' +

            '💵 **Kalan bakiye:** `' +
            formatMoney(
                balance
            ) +
            ' Cash`\n\n' +

            '📩 **Talebin yetkililere otomatik olarak iletildi.**\n\n' +

            '⏳ Yetkililer en kısa sürede ödülünü teslim edecektir.'

        )

        .setFooter({

            text:
                'CashBot • Cash Market'

        })

        .setTimestamp();
}

// ==========================================
// MARKET
// ==========================================

async function handleMarketButton(
    interaction
) {

    const customId =
        interaction.customId;

    const product =
        customId.replace(
            'market_',
            ''
        );

    // ==========================================
    // ÜRÜN KONTROL
    // ==========================================

    if (
        !MARKET_PRICES[product]
    ) {

        return interaction.reply({

            content:
                '❌ Geçersiz market ürünü.',

            ephemeral: true

        });
    }

    const PRICE =
        MARKET_PRICES[product];

    // ==========================================
    // BAKİYE
    // ==========================================

    const balance =
        getUserBalance(
            interaction.user.id
        );

    if (
        balance < PRICE
    ) {

        return interaction.reply({

            content:

                '❌ **Yeterli Cash bulunmuyor.**\n\n' +

                '💰 Bakiyen: `' +
                formatMoney(balance) +
                ' Cash`\n' +

                '🛍️ Ürün: **' +
                MARKET_NAMES[product] +
                '**\n' +

                '💵 Fiyat: `' +
                formatMoney(PRICE) +
                ' Cash`\n\n' +

                '❗ Eksik Cash: `' +
                formatMoney(
                    PRICE - balance
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
                    '❌ `VIP_ROLE_ID` .env dosyasında bulunamadı.',

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
                    '❌ Zaten **VIP** rolüne sahipsin.',

                ephemeral: true

            });
        }

        try {

            await interaction.member.roles.add(
                role
            );

        } catch (error) {

            console.error(
                '❌ VIP rolü verme hatası:',
                error
            );

            return interaction.reply({

                content:
                    '❌ VIP rolü verilemedi. Botun rolünün VIP rolünden yukarıda olduğundan emin ol.',

                ephemeral: true

            });
        }

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            await interaction.member.roles
                .remove(role)
                .catch(() => {});

            return interaction.reply({

                content:
                    '❌ Cash işlemi kaydedilemedi. VIP rolün geri alındı.',

                ephemeral: true

            });
        }

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0xF1C40F)

                    .setTitle(
                        '💎 VIP SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '💎 **VIP rolün başarıyla verildi.**\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • Cash Market'
                    })

                    .setTimestamp()

            ],

            ephemeral: true

        });
    }

    // ==========================================
    // WEED PERMİ
    // ==========================================

    if (
        product === 'weed'
    ) {

        const roleId =
            process.env.WEED_ROLE_ID;

        if (!roleId) {

            return interaction.reply({

                content:
                    '❌ `WEED_ROLE_ID` .env dosyasında bulunamadı.',

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
                    '❌ Weed Permi rolü sunucuda bulunamadı.',

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
                    '❌ Zaten **Weed Permi** rolüne sahipsin.',

                ephemeral: true

            });
        }

        try {

            await interaction.member.roles.add(
                role
            );

        } catch (error) {

            console.error(
                '❌ Weed rolü verme hatası:',
                error
            );

            return interaction.reply({

                content:
                    '❌ Weed Permi verilemedi. Botun rolünün Weed Permi rolünden yukarıda olduğundan emin ol.',

                ephemeral: true

            });
        }

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            await interaction.member.roles
                .remove(role)
                .catch(() => {});

            return interaction.reply({

                content:
                    '❌ Cash işlemi kaydedilemedi. Weed Permi geri alındı.',

                ephemeral: true

            });
        }

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0x2ECC71)

                    .setTitle(
                        '🌿 WEED PERMİ SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '🌿 **Weed Permi rolün başarıyla verildi.**\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • Cash Market'
                    })

                    .setTimestamp()

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

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            return interaction.reply({

                content:
                    '❌ Satın alma kaydedilemedi.',

                ephemeral: true

            });
        }

        await createMarketClaim(
            interaction,
            product
        );

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0x9B59B6)

                    .setTitle(
                        '🎁 SÜRPRİZ ÖDÜL SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 ' +
                        interaction.user +
                        ' sürpriz ödülünü satın aldı!\n\n' +

                        '🎁 **Ödül hakkın oluşturuldu.**\n\n' +

                        '🚗 Boss veya OG garajındaki araçlardan 1 tanesine talip olabilirsin.\n\n' +

                        '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

                        '🎫 Yetkililer talebini kontrol edip ödülünü teslim edecektir.\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • Sürpriz Ödül'
                    })

                    .setTimestamp()

            ],

            ephemeral: true

        });
    }

    // ==========================================
    // ARAÇ ÖDÜLÜ
    // ==========================================

    if (
        product === 'vehicle'
    ) {

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            return interaction.reply({

                content:
                    '❌ Satın alma kaydedilemedi.',

                ephemeral: true

            });
        }

        await createMarketClaim(
            interaction,
            product
        );

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0x3498DB)

                    .setTitle(
                        '🚗 ARAÇ ÖDÜLÜ SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '🚗 **1.000.000 Cash karşılığında araç ödülü satın aldın.**\n\n' +

                        '🏎️ **Galeriden 1 adet araç seçebilirsin.**\n\n' +

                        '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

                        '🎫 Araç talebin yetkililere otomatik olarak gönderildi.\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • Araç Ödülü'
                    })

                    .setTimestamp()

            ],

            ephemeral: true

        });
    }

    // ==========================================
    // FIVEM FIGHT PAKET
    // ==========================================

    if (
        product === 'fight'
    ) {

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            return interaction.reply({

                content:
                    '❌ Satın alma kaydedilemedi.',

                ephemeral: true

            });
        }

        await createMarketClaim(
            interaction,
            product
        );

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0xE74C3C)

                    .setTitle(
                        '🔫 FIVEM FIGHT PAKET SATIN ALINDI!'
                    )

                    .setDescription(

                        '🔥 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '🔫 **FiveM Fight Paket satın alındı.**\n\n' +

                        '📦 Paket içeriği:\n' +

                        '🔫 **1x Fight Silahı**\n' +

                        '🔸 **100x Mermi**\n' +

                        '🩹 **10x Bandaj**\n' +

                        '🛡️ **10x Zırh**\n\n' +

                        '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

                        '🎫 **Paket talebin yetkililere otomatik olarak gönderildi.**\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • FiveM Fight Paket'
                    })

                    .setTimestamp()

            ],

            ephemeral: true

        });
    }

    // ==========================================
    // ÖZEL ROL
    // ==========================================

    if (
        product === 'special'
    ) {

        const result =
            removeUserMoney(
                interaction.user.id,
                PRICE
            );

        if (!result.success) {

            return interaction.reply({

                content:
                    '❌ Satın alma kaydedilemedi.',

                ephemeral: true

            });
        }

        await createMarketClaim(
            interaction,
            product
        );

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(0xE74C3C)

                    .setTitle(
                        '⭐ ÖZEL ROL SATIN ALINDI!'
                    )

                    .setDescription(

                        '🎉 Tebrikler ' +
                        interaction.user +
                        '!\n\n' +

                        '⭐ **Özel Rol satın alma işlemin başarıyla tamamlandı.**\n\n' +

                        '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

                        '🎫 Özel rol talebin yetkililere otomatik olarak gönderildi.\n\n' +

                        '⏳ Yetkililer rolünü en kısa sürede teslim edecektir.\n\n' +

                        '💰 Ödenen: `' +
                        formatMoney(PRICE) +
                        ' Cash`\n\n' +

                        '💵 Kalan bakiye: `' +
                        formatMoney(result.balance) +
                        ' Cash`'

                    )

                    .setFooter({
                        text:
                            'CashBot • Özel Rol'
                    })

                    .setTimestamp()

            ],

            ephemeral: true

        });
    }

    return interaction.reply({

        content:
            '❌ Geçersiz market ürünü.',

        ephemeral: true

    });
}

// ==========================================
// TICKET SİSTEMİ
// ==========================================

async function handleTicketButton(
    interaction
) {

    const type =
        interaction.customId.replace(
            'ticket_',
            ''
        );

    // ==========================================
    // KAPAT
    // ==========================================

    if (
        type === 'close'
    ) {

        await interaction.reply({

            content:
                '🔒 Ticket 5 saniye içerisinde kapatılıyor...'

        });

        setTimeout(
            async function() {

                await interaction.channel
                    .delete()
                    .catch(
                        function() {}
                    );

            },
            5000
        );

        return;
    }

    // ==========================================
    // KATEGORİLER
    // ==========================================

    const categoryNames = {

        destek: 'destek',

        donate: 'donate',

        sikayet: 'sikayet',

        teknik: 'teknik'

    };

    const ticketName =
        categoryNames[type];

    if (!ticketName) {

        return;
    }

    // ==========================================
    // AÇIK TICKET
    // ==========================================

    const existingChannel =
        interaction.guild.channels.cache.find(
            function(channel) {

                return (

                    channel.type ===
                        ChannelType.GuildText &&

                    channel.topic ===
                        'ticket-' +
                        interaction.user.id

                );
            }
        );

    if (existingChannel) {

        return interaction.reply({

            content:
                '❌ Zaten açık bir ticketın var: ' +
                existingChannel,

            ephemeral: true

        });
    }

    // ==========================================
    // TICKET OLUŞTUR
    // ==========================================

    let channel;

    try {

        channel =
            await interaction.guild.channels.create({

                name:
                    'ticket-' +
                    ticketName +
                    '-' +
                    interaction.user.username,

                type:
                    ChannelType.GuildText,

                parent:
                    process.env.TICKET_CATEGORY_ID,

                topic:
                    'ticket-' +
                    interaction.user.id,

                permissionOverwrites: [

                    {
                        id:
                            interaction.guild.id,

                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },

                    {
                        id:
                            interaction.user.id,

                        allow: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages,

                            PermissionFlagsBits.ReadMessageHistory

                        ]
                    },

                    {
                        id:
                            process.env.TICKET_STAFF_ROLE_ID,

                        allow: [

                            PermissionFlagsBits.ViewChannel,

                            PermissionFlagsBits.SendMessages,

                            PermissionFlagsBits.ReadMessageHistory

                        ]
                    }
                ]
            });

    } catch (error) {

        console.error(
            '❌ Ticket oluşturma hatası:',
            error
        );

        return interaction.reply({

            content:
                '❌ Ticket oluşturulamadı. Bot izinlerini kontrol et.',

            ephemeral: true

        });
    }

    const embed =
        new EmbedBuilder()

            .setColor(0x5865F2)

            .setTitle(
                '🎫 Ticket Oluşturuldu'
            )

            .setDescription(

                'Merhaba ' +
                interaction.user +
                '!\n\n' +

                'Talebiniz başarıyla oluşturuldu.\n' +

                'Yetkililer en kısa sürede sizinle ilgilenecektir.\n\n' +

                '📂 **Kategori:** ' +
                ticketName +
                '\n\n' +

                '🔒 Ticketı kapatmak için aşağıdaki butonu kullanabilirsiniz.'

            )

            .setFooter({

                text:
                    'CashBot • Destek Sistemi'

            })

            .setTimestamp();

    const closeButton =
        new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'ticket_close'
                    )

                    .setLabel(
                        'Ticket Kapat'
                    )

                    .setEmoji(
                        '🔒'
                    )

                    .setStyle(
                        ButtonStyle.Danger
                    )

            );

    await channel.send({

        content:
            interaction.user +
            ' <@&' +
            process.env.TICKET_STAFF_ROLE_ID +
            '>',

        embeds: [
            embed
        ],

        components: [
            closeButton
        ]

    });

    await interaction.reply({

        content:
            '✅ Ticket oluşturuldu: ' +
            channel,

        ephemeral: true

    });
}

// ==========================================
// ZAR SAVAŞI
// ==========================================

async function handleDiceBattle(
    interaction
) {

    const customId =
        interaction.customId;

    const isAccept =
        customId.startsWith(
            'zar_kabul_'
        );

    const prefix =
        isAccept
            ? 'zar_kabul_'
            : 'zar_reddet_';

    const battleId =
        customId.substring(
            prefix.length
        );

    const diceCommand =
        client.commands.get(
            'zar-savas'
        );

    if (
        !diceCommand ||
        !diceCommand.activeBattles
    ) {

        return interaction.reply({

            content:
                '❌ Zar savaşı sistemi şu anda kullanılamıyor.',

            ephemeral: true

        });
    }

    const activeBattles =
        diceCommand.activeBattles;

    const battle =
        activeBattles.get(
            battleId
        );

    if (!battle) {

        return interaction.reply({

            content:
                '❌ Bu zar savaşı artık aktif değil veya süresi dolmuş.',

            ephemeral: true

        });
    }

    if (
        interaction.user.id !==
        battle.opponentId
    ) {

        return interaction.reply({

            content:
                '❌ Bu zar savaşı teklifine sadece davet edilen kişi cevap verebilir.',

            ephemeral: true

        });
    }

    // ==========================================
    // REDDET
    // ==========================================

    if (!isAccept) {

        activeBattles.delete(
            battleId
        );

        activeBattles.delete(
            battle.challengerId
        );

        activeBattles.delete(
            battle.opponentId
        );

        return interaction.update({

            content:
                '❌ Zar savaşı teklifi reddedildi.',

            embeds: [],

            components: []

        });
    }

    // ==========================================
    // BAHİS
    // ==========================================

    const bet =
        Number(
            battle.bet
        );

    if (
        !Number.isFinite(bet) ||
        bet <= 0
    ) {

        return interaction.update({

            content:
                '❌ Geçersiz bahis miktarı.',

            embeds: [],

            components: []

        });
    }

    // ==========================================
    // BAKİYELER
    // ==========================================

    const challengerBalance =
        getUserBalance(
            battle.challengerId
        );

    const opponentBalance =
        getUserBalance(
            battle.opponentId
        );

    if (
        challengerBalance < bet
    ) {

        activeBattles.delete(
            battleId
        );

        activeBattles.delete(
            battle.challengerId
        );

        activeBattles.delete(
            battle.opponentId
        );

        return interaction.update({

            content:
                '❌ Zar savaşı iptal edildi. Meydan okuyan oyuncunun artık yeterli Cash bakiyesi bulunmuyor.',

            embeds: [],

            components: []

        });
    }

    if (
        opponentBalance < bet
    ) {

        activeBattles.delete(
            battleId
        );

        activeBattles.delete(
            battle.challengerId
        );

        activeBattles.delete(
            battle.opponentId
        );

        return interaction.update({

            content:
                '❌ Zar savaşı iptal edildi. Rakibin yeterli Cash bakiyesi bulunmuyor.',

            embeds: [],

            components: []

        });
    }

    // ==========================================
    // BAHİSLERİ ÇEK
    // ==========================================

    const challengerRemove =
        removeUserMoney(
            battle.challengerId,
            bet
        );

    const opponentRemove =
        removeUserMoney(
            battle.opponentId,
            bet
        );

    if (
        !challengerRemove.success ||
        !opponentRemove.success
    ) {

        return interaction.update({

            content:
                '❌ Zar savaşı sırasında Cash işlemi başarısız oldu.',

            embeds: [],

            components: []

        });
    }

    // ==========================================
    // ZARLAR
    // ==========================================

    const challengerRoll =
        Math.floor(
            Math.random() * 6
        ) + 1;

    const opponentRoll =
        Math.floor(
            Math.random() * 6
        ) + 1;

    const totalPrize =
        bet * 2;

    let winnerId = null;
    let draw = false;

    if (
        challengerRoll >
        opponentRoll
    ) {

        winnerId =
            battle.challengerId;

    } else if (
        opponentRoll >
        challengerRoll
    ) {

        winnerId =
            battle.opponentId;

    } else {

        draw = true;
    }

    // ==========================================
    // KAZANAN
    // ==========================================

    if (!draw) {

        addUserMoney(
            winnerId,
            totalPrize
        );

    } else {

        addUserMoney(
            battle.challengerId,
            bet
        );

        addUserMoney(
            battle.opponentId,
            bet
        );
    }

    // ==========================================
    // BATTLE TEMİZLE
    // ==========================================

    activeBattles.delete(
        battleId
    );

    activeBattles.delete(
        battle.challengerId
    );

    activeBattles.delete(
        battle.opponentId
    );

    // ==========================================
    // SONUÇ
    // ==========================================

    let resultTitle;
    let resultDescription;
    let resultColor;

    if (draw) {

        resultTitle =
            '🤝 ZAR SAVAŞI BERABERE!';

        resultColor =
            0xFEE75C;

        resultDescription =

            '🎲 İki oyuncu da aynı zarı attı!\n\n' +

            '💰 Bahisler iki oyuncuya da geri ödendi.\n\n' +

            '💵 İade edilen bahis: `' +
            formatMoney(bet) +
            ' Cash`';

    } else {

        resultTitle =
            '🏆 ZAR SAVAŞI SONUCU!';

        resultColor =
            0x57F287;

        resultDescription =

            '🎲 Büyük zarı atan oyuncu kazandı!\n\n' +

            '🏆 **Kazanan:** <@' +
            winnerId +
            '>\n\n' +

            '💰 **Kazanç:** `' +
            formatMoney(totalPrize) +
            ' Cash`';

    }

    const resultEmbed =
        new EmbedBuilder()

            .setColor(
                resultColor
            )

            .setTitle(
                resultTitle
            )

            .setDescription(
                resultDescription
            )

            .addFields(

                {
                    name:
                        '⚔️ Meydan Okuyan',

                    value:
                        '<@' +
                        battle.challengerId +
                        '>\n🎲 `' +
                        challengerRoll +
                        '`',

                    inline: true
                },

                {
                    name:
                        '🎯 Rakip',

                    value:
                        '<@' +
                        battle.opponentId +
                        '>\n🎲 `' +
                        opponentRoll +
                        '`',

                    inline: true
                },

                {
                    name:
                        '💵 Bahis',

                    value:
                        '`' +
                        formatMoney(bet) +
                        ' Cash`',

                    inline: true
                }

            )

            .setFooter({

                text:
                    'CashBot • Zar Savaşı'

            })

            .setTimestamp();

    await interaction.update({

        content:
            '🎲 Zar savaşı tamamlandı!',

        embeds: [
            resultEmbed
        ],

        components: []

    });
}

// ==========================================
// TOKEN
// ==========================================

if (!process.env.TOKEN) {

    console.error(
        '❌ TOKEN bulunamadı! .env dosyanı kontrol et.'
    );

    process.exit(1);
}

// ==========================================
// LOGIN
// ==========================================

client.login(
    process.env.TOKEN
);