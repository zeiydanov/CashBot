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
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// ==========================================
// ECONOMY
// ==========================================

const economy = require('./utils/economy');

// ==========================================
// CLIENT
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
// COMMANDS
// ==========================================

client.commands = new Collection();

// ==========================================
// 1. SUNUCU CASHBOT ERİŞİM SİSTEMİ
// ==========================================

// SADECE 1. SUNUCUDA GEÇERLİDİR.
//
// Bu ID bir Discord ROL ID'sidir.
//
// 2. SUNUCUDA BU SİSTEM DEVRE DIŞIDIR.

const FIRST_GUILD_ACCESS_ROLE_ID =
    '1516432684396843139';

// ==========================================
// 1. SUNUCU KONTROL
// ==========================================

function isFirstGuild(guildId) {

    return (
        guildId &&
        guildId === process.env.GUILD_ID
    );
}

// ==========================================
// MODERASYON KOMUTU TESPİTİ
// ==========================================
//
// Moderasyon command dosyalarında:
//
// moderation: true
//
// veya:
//
// isModeration: true
//
// veya:
//
// category: 'moderation'
//
// kullanabilirsin.
//
// 2. sunucuyu etkilemez.
// ==========================================

function isModerationCommand(command) {

    if (!command) {
        return false;
    }

    // --------------------------------------
    // moderation: true
    // --------------------------------------

    if (
        command.moderation === true
    ) {

        return true;
    }

    // --------------------------------------
    // isModeration: true
    // --------------------------------------

    if (
        command.isModeration === true
    ) {

        return true;
    }

    // --------------------------------------
    // category: moderation
    // --------------------------------------

    if (
        typeof command.category === 'string' &&
        command.category.toLowerCase() === 'moderation'
    ) {

        return true;
    }

    // --------------------------------------
    // data.category: moderation
    // --------------------------------------

    if (
        typeof command.data?.category === 'string' &&
        command.data.category.toLowerCase() === 'moderation'
    ) {

        return true;
    }

    return false;
}

// ==========================================
// CASHBOT ACCESS CONTROL
// ==========================================

function checkCashBotAccess(
    interaction,
    command
) {

    // ======================================
    // 2. SUNUCU VE DİĞER SUNUCULAR
    // ======================================
    //
    // BURADA HİÇBİR DEĞİŞİKLİK YAPILMIYOR.
    //
    // Mevcut Homie sistemi aynen devam eder.

    if (
        !isFirstGuild(
            interaction.guild?.id
        )
    ) {

        return {
            allowed: true
        };
    }

    // ======================================
    // DM KONTROLÜ
    // ======================================

    if (
        !interaction.guild
    ) {

        return {
            allowed: false,

            reason:
                '❌ Bu komut sadece sunucuda kullanılabilir.'
        };
    }

    // ======================================
    // MEMBER KONTROLÜ
    // ======================================

    const member =
        interaction.member;

    if (!member) {

        return {
            allowed: false,

            reason:
                '❌ Sunucu üye bilgisi alınamadı.'
        };
    }

    // ======================================
    // 1. SUNUCUDA MODERASYON
    // ======================================
    //
    // Moderasyon komutları 1. sunucuda
    // CashBot kullanıcılarına kapalıdır.

    if (
        isModerationCommand(
            command
        )
    ) {

        return {
            allowed: false,

            reason:
                '❌ Bu sunucuda CashBot moderasyon komutlarına erişimin yok.'
        };
    }

    // ======================================
    // CASHBOT ERİŞİM ROLÜ
    // ======================================

    const hasCashBotRole =
        member.roles.cache.has(
            FIRST_GUILD_ACCESS_ROLE_ID
        );

    if (
        !hasCashBotRole
    ) {

        return {
            allowed: false,

            reason:
                '❌ CashBot kullanmak için gerekli role sahip değilsin.'
        };
    }

    // ======================================
    // ERİŞİM VAR
    // ======================================

    return {
        allowed: true
    };
}

// ==========================================
// LOAD COMMANDS
// ==========================================

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

            delete require.cache[
                require.resolve(filePath)
            ];

            const command =
                require(filePath);

            if (
                command.data &&
                command.execute
            ) {

                client.commands.set(
                    command.data.name,
                    command
                );

                const moderation =
                    isModerationCommand(
                        command
                    );

                console.log(
                    `${moderation ? '🛡️' : '✅'} Komut yüklendi: /${command.data.name}`
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
// ECONOMY
// ==========================================

client.economy = economy;

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
// KİLİTLER
// ==========================================

// Ticket çift oluşturma koruması
const ticketCreationLocks = new Set();

// Kayıt çift oluşturma koruması
const kayitCreationLocks = new Set();

// ==========================================
// SUNUCU CONFIG
// ==========================================

function getGuildConfig(guildId) {

    // ======================================
    // 1. SUNUCU
    // ======================================

    if (
        guildId === process.env.GUILD_ID
    ) {

        return {

            guildId:
                process.env.GUILD_ID,

            ticketCategoryId:
                process.env.TICKET_CATEGORY_ID,

            ticketStaffRoleId:
                process.env.TICKET_STAFF_ROLE_ID,

            logChannelId:
                process.env.LOG_CHANNEL_ID,

            announcementChannelId:
                process.env.ANNOUNCEMENT_CHANNEL_ID,

            diceRoleId:
                process.env.DICE_ROLE_ID,

            diceRoleId2:
                process.env.DICE_ROLE_ID_2,

            kayitCategoryId:
                process.env.KAYIT_CATEGORY_ID,

            kayitStaffRoleId:
                process.env.KAYIT_STAFF_ROLE_ID,

            kayitRoleId:
                process.env.KAYIT_ROLE_ID,

            vipRoleId:
                process.env.VIP_ROLE_ID,

            staffRoleId:
                process.env.STAFF_ROLE_ID,

            weedRoleId:
                process.env.WEED_ROLE_ID
        };
    }

    // ======================================
    // 2. SUNUCU
    // ======================================

    if (
        guildId === process.env.GUILD_ID_2
    ) {

        return {

            guildId:
                process.env.GUILD_ID_2,

            ticketCategoryId:
                process.env.TICKET_CATEGORY_ID_2,

            ticketStaffRoleId:
                process.env.TICKET_STAFF_ROLE_ID_2,

            logChannelId:
                process.env.LOG_CHANNEL_ID_2,

            announcementChannelId:
                process.env.ANNOUNCEMENT_CHANNEL_ID_2,

            diceRoleId:
                process.env.DICE_ROLE_ID_2_1,

            diceRoleId2:
                process.env.DICE_ROLE_ID_2_2,

            kayitCategoryId:
                process.env.KAYIT_CATEGORY_ID_2,

            kayitStaffRoleId:
                process.env.KAYIT_STAFF_ROLE_ID_2,

            kayitRoleId:
                process.env.KAYIT_ROLE_ID_2,

            vipRoleId:
                process.env.VIP_ROLE_ID_2,

            staffRoleId:
                process.env.STAFF_ROLE_ID_2,

            weedRoleId:
                process.env.WEED_ROLE_ID_2
        };
    }

    return null;
}

// ==========================================
// CONFIG KONTROL
// ==========================================

function checkGuildConfig(guild) {

    const config =
        getGuildConfig(guild.id);

    if (!config) {

        console.log(
            `⚠️ ${guild.name} (${guild.id}) için config bulunamadı.`
        );

        return null;
    }

    return config;
}

// ==========================================
// ID KONTROL
// ==========================================

function validId(id) {

    return (
        typeof id === 'string' &&
        /^\d{17,20}$/.test(id)
    );
}

// ==========================================
// MARKET
// ==========================================

const MARKET_PRICES = {

    vip: 50000,

    weed: 100000,

    surprise: 200000,

    vehicle: 1000000,

    fight: 500000,

    special: 250000

};

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

    return Number(
        amount
    ).toLocaleString('tr-TR');
}

// ==========================================
// BOT READY
// ==========================================

client.once(
    'clientReady',
    () => {

        console.log('');

        console.log(
            '=========================================='
        );

        console.log(
            `🤖 ${client.user.tag} AKTİF`
        );

        console.log(
            '=========================================='
        );

        console.log(
            `📦 Komut sayısı: ${client.commands.size}`
        );

        console.log(
            `🏠 Bağlı sunucu sayısı: ${client.guilds.cache.size}`
        );

        console.log(
            '💰 Economy System: AKTİF'
        );

        console.log(
            '🛒 Cash Market: AKTİF'
        );

        console.log(
            '🎲 Zar Savaşı: AKTİF'
        );

        console.log(
            '🎫 Ticket System: AKTİF'
        );

        console.log(
            '🔐 Ticket Double-Create Protection: AKTİF'
        );

        console.log(
            '📋 Kayıt Sistemi: AKTİF'
        );

        console.log(
            '🔐 Kayıt Double-Create Protection: AKTİF'
        );

        console.log(
            `🔐 1. Sunucu CashBot Rolü: ${FIRST_GUILD_ACCESS_ROLE_ID}`
        );

        console.log('');

        console.log(
            '---------- SUNUCU AYARLARI ----------'
        );

        for (
            const guild
            of client.guilds.cache.values()
        ) {

            const config =
                getGuildConfig(
                    guild.id
                );

            console.log('');

            console.log(
                `🏠 ${guild.name}`
            );

            console.log(
                `🆔 ${guild.id}`
            );

            if (!config) {

                console.log(
                    '❌ Bu sunucu için .env ayarı bulunamadı.'
                );

                continue;
            }

            console.log(
                `🎫 Ticket Kategori: ${config.ticketCategoryId || 'YOK'}`
            );

            console.log(
                `👮 Ticket Staff: ${config.ticketStaffRoleId || 'YOK'}`
            );

            console.log(
                `📋 Log Kanalı: ${config.logChannelId || 'YOK'}`
            );

            console.log(
                `📝 Kayıt Kategori: ${config.kayitCategoryId || 'YOK'}`
            );

            console.log(
                `👮 Kayıt Staff: ${config.kayitStaffRoleId || 'YOK'}`
            );

            console.log(
                `💎 VIP Rolü: ${config.vipRoleId || 'YOK'}`
            );

            console.log(
                `🌿 Weed Rolü: ${config.weedRoleId || 'YOK'}`
            );

            if (
                isFirstGuild(
                    guild.id
                )
            ) {

                console.log(
                    `🔐 CashBot Kullanıcı Rolü: ${FIRST_GUILD_ACCESS_ROLE_ID}`
                );

                console.log(
                    '🛡️ Moderasyon komutları: KAPALI'
                );
            }

            if (
                guild.id ===
                process.env.GUILD_ID_2
            ) {

                console.log(
                    '🔓 2. Sunucu erişim sistemi: MEVCUT SİSTEM'
                );
            }
        }

        console.log('');

        console.log(
            '=========================================='
        );
    }
);

// ==========================================
// INTERACTION
// ==========================================

client.on(
    'interactionCreate',
    async interaction => {

        try {

            // ======================================
            // BUTTON
            // ======================================

            if (
                interaction.isButton()
            ) {

                // ==================================
                // ZAR
                // ==================================

                if (
                    interaction.customId.startsWith(
                        'zar_kabul_'
                    ) ||
                    interaction.customId.startsWith(
                        'zar_reddet_'
                    )
                ) {

                    await handleDiceBattle(
                        interaction
                    );

                    return;
                }

                // ==================================
                // MARKET
                // ==================================

                if (
                    interaction.customId.startsWith(
                        'market_'
                    )
                ) {

                    await handleMarketButton(
                        interaction
                    );

                    return;
                }

                // ==================================
                // TICKET
                // ==================================

                if (
                    interaction.customId.startsWith(
                        'ticket_'
                    )
                ) {

                    await handleTicketButton(
                        interaction
                    );

                    return;
                }

                // ==================================
                // KAYIT
                // ==================================

                if (
                    interaction.customId ===
                    'kayit_baslat'
                ) {

                    await showKayitModal(
                        interaction
                    );

                    return;
                }

                // ==================================
                // KAYIT KAPAT
                // ==================================

                if (
                    interaction.customId ===
                    'kayit_close'
                ) {

                    await handleKayitClose(
                        interaction
                    );

                    return;
                }
            }

            // ======================================
            // MODAL
            // ======================================

            if (
                interaction.isModalSubmit()
            ) {

                if (
                    interaction.customId ===
                    'kayit_formu'
                ) {

                    await handleKayitModal(
                        interaction
                    );

                    return;
                }
            }

            // ======================================
            // SLASH COMMAND
            // ======================================

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

            // ======================================
            // CASHBOT ACCESS CONTROL
            // ======================================
            //
            // SADECE 1. SUNUCUDA AKTİF.
            //
            // 2. SUNUCUDA:
            // allowed = true
            //
            // Böylece mevcut Homie sistemi
            // değiştirilmez.

            const access =
                checkCashBotAccess(
                    interaction,
                    command
                );

            if (
                !access.allowed
            ) {

                return interaction.reply({

                    content:
                        access.reason ||
                        '❌ Bu komutu kullanma yetkin yok.',

                    ephemeral: true

                });
            }

            // ======================================
            // COMMAND EXECUTE
            // ======================================

            await command.execute(
                interaction
            );

        } catch (error) {

            console.error(
                '❌ INTERACTION HATASI:',
                error
            );

            try {

                const message = {

                    content:
                        '❌ İşlem sırasında bir hata oluştu.',

                    ephemeral: true
                };

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.followUp(
                        message
                    );

                } else {

                    await interaction.reply(
                        message
                    );
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
// MARKET TALEP
// ==========================================

async function createMarketClaim(
    interaction,
    product
) {

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    if (!config) {

        console.error(
            '❌ Market config bulunamadı.'
        );

        return null;
    }

    const logChannelId =
        config.logChannelId;

    if (!validId(logChannelId)) {

        console.error(
            `❌ LOG_CHANNEL_ID geçersiz: ${logChannelId}`
        );

        return null;
    }

    const channel =
        interaction.guild.channels.cache.get(
            logChannelId
        );

    if (!channel) {

        console.error(
            `❌ Log kanalı bulunamadı: ${logChannelId}`
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

                `👤 **Oyuncu:** ${interaction.user}\n` +

                `🆔 **ID:** \`${interaction.user.id}\`\n\n` +

                `🛍️ **Ürün:** ${productName}\n` +

                `💰 **Ödenen:** \`${formatMoney(
                    MARKET_PRICES[product]
                )} Cash\`\n\n` +

                '🎫 **Talep durumu:** Yetkili teslimatı bekleniyor.\n\n' +

                '⚠️ Bu talep Cash Market satın alımı sonucunda otomatik oluşturulmuştur.'
            )

            .setFooter({
                text:
                    'CashBot • Market Talepleri'
            })

            .setTimestamp();

    try {

        return await channel.send({

            content:
                `📦 **MARKET TALEBİ** <@${interaction.user.id}>`,

            embeds: [
                embed
            ]

        });

    } catch (error) {

        console.error(
            '❌ Market talebi gönderilemedi:',
            error
        );

        return null;
    }
}

// ==========================================
// MARKET BUTTON
// ==========================================

async function handleMarketButton(
    interaction
) {

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    if (!config) {

        return interaction.reply({

            content:
                '❌ Bu sunucu CashBot tarafından yapılandırılmamış.',

            ephemeral: true

        });
    }

    const product =
        interaction.customId.replace(
            'market_',
            ''
        );

    if (
        !Object.prototype.hasOwnProperty.call(
            MARKET_PRICES,
            product
        )
    ) {

        return interaction.reply({

            content:
                '❌ Geçersiz market ürünü.',

            ephemeral: true

        });
    }

    const PRICE =
        MARKET_PRICES[product];

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

                `💰 Bakiyen: \`${formatMoney(balance)} Cash\`\n` +

                `🛍️ Ürün: **${MARKET_NAMES[product]}**\n` +

                `💵 Fiyat: \`${formatMoney(PRICE)} Cash\`\n\n` +

                `❗ Eksik Cash: \`${formatMoney(
                    PRICE - balance
                )} Cash\``,

            ephemeral: true

        });
    }

    // ======================================
    // VIP
    // ======================================

    if (
        product === 'vip'
    ) {

        return await purchaseRoleProduct(
            interaction,
            config,
            'vip',
            PRICE,
            config.vipRoleId,
            '💎 VIP SATIN ALINDI!',
            '💎 **VIP rolün başarıyla verildi.**',
            0xF1C40F
        );
    }

    // ======================================
    // WEED
    // ======================================

    if (
        product === 'weed'
    ) {

        return await purchaseRoleProduct(
            interaction,
            config,
            'weed',
            PRICE,
            config.weedRoleId,
            '🌿 WEED PERMİ SATIN ALINDI!',
            '🌿 **Weed Permi rolün başarıyla verildi.**',
            0x2ECC71
        );
    }

    // ======================================
    // MANUEL ÜRÜNLER
    // ======================================

    const result =
        removeUserMoney(
            interaction.user.id,
            PRICE
        );

    if (!result.success) {

        return interaction.reply({

            content:
                '❌ Cash işlemi gerçekleştirilemedi.',

            ephemeral: true

        });
    }

    await createMarketClaim(
        interaction,
        product
    );

    let title;
    let description;
    let color;

    if (
        product === 'surprise'
    ) {

        title =
            '🎁 SÜRPRİZ ÖDÜL SATIN ALINDI!';

        color =
            0x9B59B6;

        description =

            `🎉 ${interaction.user} sürpriz ödülünü satın aldı!\n\n` +

            '🎁 **Ödül hakkın oluşturuldu.**\n\n' +

            '🚗 Boss veya OG garajındaki araçlardan 1 tanesine talip olabilirsin.\n\n' +

            '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

            '🎫 Yetkililer talebini kontrol edip ödülünü teslim edecektir.';

    } else if (
        product === 'vehicle'
    ) {

        title =
            '🚗 ARAÇ ÖDÜLÜ SATIN ALINDI!';

        color =
            0x3498DB;

        description =

            `🎉 Tebrikler ${interaction.user}!\n\n` +

            '🚗 **1.000.000 Cash karşılığında araç ödülü satın aldın.**\n\n' +

            '🏎️ **Galeriden 1 adet araç seçebilirsin.**\n\n' +

            '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

            '🎫 Araç talebin yetkililere otomatik olarak gönderildi.';

    } else if (
        product === 'fight'
    ) {

        title =
            '🔫 FIVEM FIGHT PAKET SATIN ALINDI!';

        color =
            0xE74C3C;

        description =

            `🔥 Tebrikler ${interaction.user}!\n\n` +

            '🔫 **FiveM Fight Paket satın alındı.**\n\n' +

            '📦 Paket içeriği:\n' +
            '🔫 **1x Fight Silahı**\n' +
            '🔸 **100x Mermi**\n' +
            '🩹 **10x Bandaj**\n' +
            '🛡️ **10x Zırh**\n\n' +

            '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

            '🎫 Paket talebin yetkililere otomatik olarak gönderildi.';

    } else if (
        product === 'special'
    ) {

        title =
            '⭐ ÖZEL ROL SATIN ALINDI!';

        color =
            0xE74C3C;

        description =

            `🎉 Tebrikler ${interaction.user}!\n\n` +

            '⭐ **Özel Rol satın alma işlemin başarıyla tamamlandı.**\n\n' +

            '📸 Bu mesajın ekran görüntüsünü al.\n\n' +

            '🎫 Özel rol talebin yetkililere otomatik olarak gönderildi.\n\n' +

            '⏳ Yetkililer rolünü en kısa sürede teslim edecektir.';

    } else {

        title =
            '🛒 SATIN ALMA BAŞARILI!';

        color =
            0x57F287;

        description =
            '🎉 Satın alma işlemin başarıyla tamamlandı.';
    }

    const embed =
        new EmbedBuilder()

            .setColor(color)

            .setTitle(title)

            .setDescription(

                description +

                '\n\n' +

                `💰 **Ödenen:** \`${formatMoney(
                    PRICE
                )} Cash\`\n\n` +

                `💵 **Kalan bakiye:** \`${formatMoney(
                    result.balance
                )} Cash\``
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
// MARKET ROLE PURCHASE
// ==========================================

async function purchaseRoleProduct(
    interaction,
    config,
    product,
    price,
    roleId,
    title,
    roleMessage,
    color
) {

    if (!validId(roleId)) {

        console.error(
            `❌ ${product} rol ID geçersiz: ${roleId}`
        );

        return interaction.reply({

            content:
                `❌ Bu sunucuda ${product} rolü yapılandırılmamış.`,

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
                '❌ Market rolü sunucuda bulunamadı.',

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
                '❌ Bu role zaten sahipsin.',

            ephemeral: true

        });
    }

    const me =
        interaction.guild.members.me;

    if (!me) {

        return interaction.reply({

            content:
                '❌ Bot sunucu üyesi bilgisine ulaşamadı.',

            ephemeral: true

        });
    }

    if (
        !me.permissions.has(
            PermissionFlagsBits.ManageRoles
        )
    ) {

        return interaction.reply({

            content:
                '❌ Botta **Rolleri Yönet** izni bulunmuyor.',

            ephemeral: true

        });
    }

    if (
        role.position >=
        me.roles.highest.position
    ) {

        return interaction.reply({

            content:
                '❌ Botun rolü satın alınacak rolün üzerinde olmalı.',

            ephemeral: true

        });
    }

    try {

        await interaction.member.roles.add(
            role
        );

    } catch (error) {

        console.error(
            '❌ Rol verme hatası:',
            error
        );

        return interaction.reply({

            content:
                `❌ Rol verilemedi.\n\n` +
                `🔧 Hata: \`${error.code || error.message}\``,

            ephemeral: true

        });
    }

    const result =
        removeUserMoney(
            interaction.user.id,
            price
        );

    if (!result.success) {

        await interaction.member.roles
            .remove(role)
            .catch(() => {});

        return interaction.reply({

            content:
                '❌ Cash işlemi kaydedilemedi. Rol geri alındı.',

            ephemeral: true

        });
    }

    return interaction.reply({

        embeds: [

            new EmbedBuilder()

                .setColor(color)

                .setTitle(title)

                .setDescription(

                    `🎉 Tebrikler ${interaction.user}!\n\n` +

                    `${roleMessage}\n\n` +

                    `💰 **Ödenen:** \`${formatMoney(
                        price
                    )} Cash\`\n\n` +

                    `💵 **Kalan bakiye:** \`${formatMoney(
                        result.balance
                    )} Cash\``
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
// TICKET FIND
// ==========================================

function findUserTicket(
    guild,
    userId
) {

    return guild.channels.cache.find(
        channel => {

            if (
                channel.type !==
                ChannelType.GuildText
            ) {

                return false;
            }

            if (
                channel.topic ===
                `ticket-${userId}`
            ) {

                return true;
            }

            if (
                channel.name.startsWith(
                    'ticket-'
                )
            ) {

                const permission =
                    channel.permissionOverwrites.cache.get(
                        userId
                    );

                if (
                    permission &&
                    permission.allow.has(
                        PermissionFlagsBits.ViewChannel
                    )
                ) {

                    return true;
                }
            }

            return false;
        }
    );
}

// ==========================================
// TICKET CONFIG
// ==========================================

function validateTicketConfig(
    guild,
    config
) {

    const result = {
        success: false,
        category: null,
        staffRole: null,
        botMember: null,
        reason: null
    };

    if (
        !validId(
            config.ticketCategoryId
        )
    ) {

        result.reason =
            `TICKET_CATEGORY_ID hatalı: ${config.ticketCategoryId}`;

        return result;
    }

    if (
        !validId(
            config.ticketStaffRoleId
        )
    ) {

        result.reason =
            `TICKET_STAFF_ROLE_ID hatalı: ${config.ticketStaffRoleId}`;

        return result;
    }

    const category =
        guild.channels.cache.get(
            config.ticketCategoryId
        );

    if (!category) {

        result.reason =
            `Ticket kategorisi bulunamadı: ${config.ticketCategoryId}`;

        return result;
    }

    if (
        category.type !==
        ChannelType.GuildCategory
    ) {

        result.reason =
            'TICKET_CATEGORY_ID bir kategori kanalı değil.';

        return result;
    }

    const staffRole =
        guild.roles.cache.get(
            config.ticketStaffRoleId
        );

    if (!staffRole) {

        result.reason =
            `Staff rolü bulunamadı: ${config.ticketStaffRoleId}`;

        return result;
    }

    const botMember =
        guild.members.me;

    if (!botMember) {

        result.reason =
            'Botun sunucu üye bilgisi alınamadı.';

        return result;
    }

    if (
        !botMember.permissions.has(
            PermissionFlagsBits.ManageChannels
        )
    ) {

        result.reason =
            'Botta Kanalları Yönet izni yok.';

        return result;
    }

    result.success = true;
    result.category = category;
    result.staffRole = staffRole;
    result.botMember = botMember;

    return result;
}

// ==========================================
// TICKET SYSTEM
// ==========================================

async function handleTicketButton(
    interaction
) {

    if (!interaction.guild) {

        return interaction.reply({

            content:
                '❌ Ticket sadece sunucuda kullanılabilir.',

            ephemeral: true

        });
    }

    const guild =
        interaction.guild;

    const userId =
        interaction.user.id;

    const config =
        getGuildConfig(
            guild.id
        );

    if (!config) {

        return interaction.reply({

            content:
                '❌ Bu sunucu için Ticket sistemi yapılandırılmamış.',

            ephemeral: true

        });
    }

    const type =
        interaction.customId.replace(
            'ticket_',
            ''
        );

    // ======================================
    // CLOSE
    // ======================================

    if (
        type === 'close'
    ) {

        if (!interaction.channel) {

            return interaction.reply({

                content:
                    '❌ Kanal bulunamadı.',

                ephemeral: true

            });
        }

        await interaction.reply({

            content:
                '🔒 Ticket 5 saniye içerisinde kapatılıyor...'

        });

        setTimeout(
            async () => {

                await interaction.channel
                    .delete()
                    .catch(() => {});

            },
            5000
        );

        return;
    }

    const categoryNames = {

        destek:
            'destek',

        donate:
            'donate',

        sikayet:
            'sikayet',

        teknik:
            'teknik'
    };

    const ticketName =
        categoryNames[type];

    if (!ticketName) {

        return interaction.reply({

            content:
                '❌ Geçersiz ticket kategorisi.',

            ephemeral: true

        });
    }

    const lockKey =
        `${guild.id}:${userId}`;

    if (
        ticketCreationLocks.has(
            lockKey
        )
    ) {

        return interaction.reply({

            content:
                '⏳ Ticket oluşturma işlemin zaten devam ediyor. Lütfen birkaç saniye bekle.',

            ephemeral: true

        });
    }

    ticketCreationLocks.add(
        lockKey
    );

    try {

        const validation =
            validateTicketConfig(
                guild,
                config
            );

        if (!validation.success) {

            return interaction.reply({

                content:
                    `❌ Ticket oluşturulamadı.\n\n` +
                    `🔧 **Sebep:** ${validation.reason}`,

                ephemeral: true

            });
        }

        const category =
            validation.category;

        const staffRole =
            validation.staffRole;

        const botMember =
            validation.botMember;

        const existingChannel =
            findUserTicket(
                guild,
                userId
            );

        if (existingChannel) {

            return interaction.reply({

                content:
                    `❌ Zaten açık bir ticketın var: ${existingChannel}`,

                ephemeral: true

            });
        }

        let username =
            interaction.user.username
                .toLowerCase()
                .replace(
                    /[^a-z0-9-_]/g,
                    ''
                )
                .substring(
                    0,
                    20
                );

        if (!username) {

            username =
                userId.substring(
                    0,
                    8
                );
        }

        const finalChannelName =
            `ticket-${ticketName}-${username}`;

        let channel;

        try {

            channel =
                await guild.channels.create({

                    name:
                        finalChannelName,

                    type:
                        ChannelType.GuildText,

                    parent:
                        category.id,

                    topic:
                        `ticket-${userId}`,

                    permissionOverwrites: [

                        {
                            id:
                                guild.id,

                            deny: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },

                        {
                            id:
                                userId,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks

                            ]
                        },

                        {
                            id:
                                staffRole.id,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks,

                                PermissionFlagsBits.ManageMessages

                            ]
                        },

                        {
                            id:
                                botMember.id,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks,

                                PermissionFlagsBits.ManageChannels,

                                PermissionFlagsBits.ManageMessages

                            ]
                        }
                    ]
                });

        } catch (error) {

            console.error(
                '❌ TICKET OLUŞTURMA HATASI:',
                error
            );

            return interaction.reply({

                content:
                    `❌ **Ticket oluşturulamadı.**\n\n` +
                    `🔧 Discord Hata Kodu: \`${error.code || 'Bilinmiyor'}\``,

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

                    `Merhaba ${interaction.user}!\n\n` +

                    'Talebiniz başarıyla oluşturuldu.\n' +
                    'Yetkililer en kısa sürede sizinle ilgilenecektir.\n\n' +

                    `📂 **Kategori:** ${ticketName}\n\n` +

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

        try {

            await channel.send({

                content:
                    `${interaction.user} <@&${staffRole.id}>`,

                embeds: [
                    embed
                ],

                components: [
                    closeButton
                ]

            });

        } catch (error) {

            console.error(
                '❌ Ticket mesajı gönderilemedi:',
                error
            );

            await channel
                .delete()
                .catch(() => {});

            return interaction.reply({

                content:
                    '❌ Ticket kanalı oluşturuldu fakat mesaj gönderilemedi.',

                ephemeral: true

            });
        }

        if (
            validId(
                config.logChannelId
            )
        ) {

            const logChannel =
                guild.channels.cache.get(
                    config.logChannelId
                );

            if (logChannel) {

                await logChannel
                    .send({

                        embeds: [

                            new EmbedBuilder()

                                .setColor(
                                    0x57F287
                                )

                                .setTitle(
                                    '🎫 YENİ TICKET'
                                )

                                .setDescription(

                                    `👤 **Kullanıcı:** ${interaction.user}\n` +

                                    `🆔 **ID:** \`${userId}\`\n\n` +

                                    `📂 **Kategori:** ${ticketName}\n` +

                                    `📌 **Kanal:** ${channel}\n\n` +

                                    `🏠 **Sunucu:** ${guild.name}`
                                )

                                .setFooter({

                                    text:
                                        'CashBot • Ticket Log'

                                })

                                .setTimestamp()

                        ]

                    })
                    .catch(() => {});
            }
        }

        return interaction.reply({

            content:
                `✅ Ticket oluşturuldu: ${channel}`,

            ephemeral: true

        });

    } finally {

        ticketCreationLocks.delete(
            lockKey
        );
    }
}

// ==========================================
// KAYIT MODALINI GÖSTER
// ==========================================

async function showKayitModal(
    interaction
) {

    if (!interaction.guild) {

        return interaction.reply({

            content:
                '❌ Kayıt sistemi sadece sunucuda kullanılabilir.',

            ephemeral: true

        });
    }

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    if (!config) {

        return interaction.reply({

            content:
                '❌ Bu sunucu için kayıt sistemi yapılandırılmamış.',

            ephemeral: true

        });
    }

    if (
        !validId(
            config.kayitCategoryId
        ) ||
        !validId(
            config.kayitStaffRoleId
        )
    ) {

        console.error(
            `❌ ${interaction.guild.name} kayıt config hatası.`
        );

        return interaction.reply({

            content:
                '❌ Kayıt sistemi yapılandırması eksik. Yönetici `.env` ayarlarını kontrol etmeli.',

            ephemeral: true

        });
    }

    const existing =
        findUserKayit(
            interaction.guild,
            interaction.user.id
        );

    if (existing) {

        return interaction.reply({

            content:
                `❌ Zaten açık bir kayıt başvurun bulunuyor: ${existing}`,

            ephemeral: true

        });
    }

    const modal =
        new ModalBuilder()
            .setCustomId(
                'kayit_formu'
            )
            .setTitle(
                '📋 OLD RP Kayıt Başvurusu'
            );

    const isim =
        new TextInputBuilder()
            .setCustomId(
                'isim_soyisim'
            )
            .setLabel(
                'İsim / Soyisim'
            )
            .setPlaceholder(
                'Örn: John Doe'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMaxLength(50);

    const yas =
        new TextInputBuilder()
            .setCustomId(
                'yas'
            )
            .setLabel(
                'Yaş'
            )
            .setPlaceholder(
                'Örn: 21'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMaxLength(3);

    const oyunId =
        new TextInputBuilder()
            .setCustomId(
                'oyun_id'
            )
            .setLabel(
                'FiveM / Oyun ID'
            )
            .setPlaceholder(
                'Örn: 1234'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMaxLength(20);

    const aktiflik =
        new TextInputBuilder()
            .setCustomId(
                'aktiflik'
            )
            .setLabel(
                'Günlük Aktiflik'
            )
            .setPlaceholder(
                'Örn: 4-5 saat'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(true)
            .setMaxLength(100);

    const deneyim =
        new TextInputBuilder()
            .setCustomId(
                'rp_deneyimi'
            )
            .setLabel(
                'RP Deneyimi / Mikrofon Durumu'
            )
            .setPlaceholder(
                'RP deneyimini ve mikrofon durumunu yaz.'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(1000);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(isim),

        new ActionRowBuilder()
            .addComponents(yas),

        new ActionRowBuilder()
            .addComponents(oyunId),

        new ActionRowBuilder()
            .addComponents(aktiflik),

        new ActionRowBuilder()
            .addComponents(deneyim)

    );

    return interaction.showModal(
        modal
    );
}

// ==========================================
// KAYIT FIND
// ==========================================

function findUserKayit(
    guild,
    userId
) {

    return guild.channels.cache.find(
        channel => {

            if (
                channel.type !==
                ChannelType.GuildText
            ) {

                return false;
            }

            if (
                channel.topic ===
                `kayit-${userId}`
            ) {

                return true;
            }

            if (
                channel.name.startsWith(
                    'kayit-'
                )
            ) {

                const permission =
                    channel.permissionOverwrites.cache.get(
                        userId
                    );

                if (
                    permission &&
                    permission.allow.has(
                        PermissionFlagsBits.ViewChannel
                    )
                ) {

                    return true;
                }
            }

            return false;
        }
    );
}

// ==========================================
// KAYIT MODAL
// ==========================================

async function handleKayitModal(
    interaction
) {

    if (!interaction.guild) {

        return interaction.reply({

            content:
                '❌ Kayıt sistemi sadece sunucuda kullanılabilir.',

            ephemeral: true

        });
    }

    const guild =
        interaction.guild;

    const userId =
        interaction.user.id;

    const config =
        getGuildConfig(
            guild.id
        );

    if (!config) {

        return interaction.reply({

            content:
                '❌ Bu sunucu için kayıt sistemi yapılandırılmamış.',

            ephemeral: true

        });
    }

    const lockKey =
        `${guild.id}:${userId}`;

    if (
        kayitCreationLocks.has(
            lockKey
        )
    ) {

        return interaction.reply({

            content:
                '⏳ Kayıt başvurun zaten oluşturuluyor. Lütfen birkaç saniye bekle.',

            ephemeral: true

        });
    }

    kayitCreationLocks.add(
        lockKey
    );

    try {

        if (
            !validId(
                config.kayitCategoryId
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Kayıt kategorisi yapılandırılmamış.',

                ephemeral: true

            });
        }

        if (
            !validId(
                config.kayitStaffRoleId
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Kayıt yetkili rolü yapılandırılmamış.',

                ephemeral: true

            });
        }

        const category =
            guild.channels.cache.get(
                config.kayitCategoryId
            );

        if (!category) {

            return interaction.reply({

                content:
                    '❌ Kayıt kategorisi bulunamadı. `.env` içindeki KAYIT_CATEGORY_ID değerini kontrol et.',

                ephemeral: true

            });
        }

        if (
            category.type !==
            ChannelType.GuildCategory
        ) {

            return interaction.reply({

                content:
                    '❌ KAYIT_CATEGORY_ID bir kategori kanalı değil.',

                ephemeral: true

            });
        }

        const staffRole =
            guild.roles.cache.get(
                config.kayitStaffRoleId
            );

        if (!staffRole) {

            return interaction.reply({

                content:
                    '❌ Kayıt yetkili rolü bulunamadı.',

                ephemeral: true

            });
        }

        const botMember =
            guild.members.me;

        if (!botMember) {

            return interaction.reply({

                content:
                    '❌ Bot üye bilgisine ulaşamadı.',

                ephemeral: true

            });
        }

        if (
            !botMember.permissions.has(
                PermissionFlagsBits.ManageChannels
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Botta **Kanalları Yönet** izni bulunmuyor.',

                ephemeral: true

            });
        }

        const existing =
            findUserKayit(
                guild,
                userId
            );

        if (existing) {

            return interaction.reply({

                content:
                    `❌ Zaten açık bir kayıt başvurun bulunuyor: ${existing}`,

                ephemeral: true

            });
        }

        const isim =
            interaction.fields.getTextInputValue(
                'isim_soyisim'
            );

        const yas =
            interaction.fields.getTextInputValue(
                'yas'
            );

        const oyunId =
            interaction.fields.getTextInputValue(
                'oyun_id'
            );

        const aktiflik =
            interaction.fields.getTextInputValue(
                'aktiflik'
            );

        const deneyim =
            interaction.fields.getTextInputValue(
                'rp_deneyimi'
            );

        let username =
            interaction.user.username
                .toLowerCase()
                .replace(
                    /[^a-z0-9-_]/g,
                    ''
                )
                .substring(
                    0,
                    18
                );

        if (!username) {

            username =
                userId.substring(
                    0,
                    8
                );
        }

        const channelName =
            `kayit-${username}`;

        let channel;

        try {

            channel =
                await guild.channels.create({

                    name:
                        channelName,

                    type:
                        ChannelType.GuildText,

                    parent:
                        category.id,

                    topic:
                        `kayit-${userId}`,

                    permissionOverwrites: [

                        {
                            id:
                                guild.id,

                            deny: [

                                PermissionFlagsBits.ViewChannel

                            ]
                        },

                        {
                            id:
                                userId,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks

                            ]
                        },

                        {
                            id:
                                staffRole.id,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks,

                                PermissionFlagsBits.ManageMessages

                            ]
                        },

                        {
                            id:
                                botMember.id,

                            allow: [

                                PermissionFlagsBits.ViewChannel,

                                PermissionFlagsBits.SendMessages,

                                PermissionFlagsBits.ReadMessageHistory,

                                PermissionFlagsBits.AttachFiles,

                                PermissionFlagsBits.EmbedLinks,

                                PermissionFlagsBits.ManageChannels,

                                PermissionFlagsBits.ManageMessages

                            ]
                        }
                    ]

                });

        } catch (error) {

            console.error('');
            console.error(
                '=========================================='
            );

            console.error(
                '❌ KAYIT KANALI OLUŞTURULAMADI'
            );

            console.error(
                `🏠 Sunucu: ${guild.name}`
            );

            console.error(
                `🆔 Sunucu ID: ${guild.id}`
            );

            console.error(
                `📂 Kategori: ${config.kayitCategoryId}`
            );

            console.error(
                `👮 Staff: ${config.kayitStaffRoleId}`
            );

            console.error(
                `🔧 Hata Kodu: ${error.code}`
            );

            console.error(
                `📋 Hata: ${error.message}`
            );

            console.error(
                '=========================================='
            );

            return interaction.reply({

                content:
                    `❌ **Kayıt kanalı oluşturulamadı.**\n\n` +
                    `🔧 Discord Hata Kodu: \`${error.code || 'Bilinmiyor'}\`\n\n` +
                    '📌 Botun kategori üzerinde **Kanalları Yönet** iznini kontrol et.',

                ephemeral: true

            });
        }

        const kayitEmbed =
            new EmbedBuilder()

                .setColor(0x57F287)

                .setTitle(
                    '📋 YENİ KAYIT BAŞVURUSU'
                )

                .setDescription(

                    `👤 **Discord Kullanıcısı:** ${interaction.user}\n` +

                    `🆔 **Discord ID:** \`${userId}\`\n\n` +

                    '━━━━━━━━━━━━━━━━━━━━\n\n' +

                    `👤 **İsim / Soyisim:**\n\`${isim}\`\n\n` +

                    `🎂 **Yaş:**\n\`${yas}\`\n\n` +

                    `🎮 **FiveM / Oyun ID:**\n\`${oyunId}\`\n\n` +

                    `🕐 **Günlük Aktiflik:**\n\`${aktiflik}\`\n\n` +

                    `🎙️ **RP Deneyimi / Mikrofon:**\n\`${deneyim}\`\n\n` +

                    '━━━━━━━━━━━━━━━━━━━━\n\n' +

                    '👮 **Kayıt yetkilileri başvuruyu inceleyebilir.**\n\n' +

                    '🔒 Başvuruyu kapatmak için aşağıdaki butonu kullanabilirsiniz.'
                )

                .setFooter({

                    text:
                        'CashBot • OLD RP Kayıt Sistemi'

                })

                .setTimestamp();

        const closeButton =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            'kayit_close'
                        )

                        .setLabel(
                            'Kayıt Başvurusunu Kapat'
                        )

                        .setEmoji(
                            '🔒'
                        )

                        .setStyle(
                            ButtonStyle.Danger
                        )
                );

        try {

            await channel.send({

                content:
                    `${interaction.user} <@&${staffRole.id}>`,

                embeds: [
                    kayitEmbed
                ],

                components: [
                    closeButton
                ]

            });

        } catch (error) {

            console.error(
                '❌ Kayıt mesajı gönderilemedi:',
                error
            );

            await channel
                .delete()
                .catch(() => {});

            return interaction.reply({

                content:
                    '❌ Kayıt kanalı oluşturuldu fakat başvuru mesajı gönderilemedi.',

                ephemeral: true

            });
        }

        if (
            validId(
                config.logChannelId
            )
        ) {

            const logChannel =
                guild.channels.cache.get(
                    config.logChannelId
                );

            if (logChannel) {

                const logEmbed =
                    new EmbedBuilder()

                        .setColor(
                            0x3498DB
                        )

                        .setTitle(
                            '📋 YENİ KAYIT BAŞVURUSU'
                        )

                        .setDescription(

                            `👤 **Kullanıcı:** ${interaction.user}\n` +

                            `🆔 **ID:** \`${userId}\`\n\n` +

                            `📌 **Kanal:** ${channel}\n\n` +

                            `🏠 **Sunucu:** ${guild.name}`
                        )

                        .setFooter({

                            text:
                                'CashBot • Kayıt Log'

                        })

                        .setTimestamp();

                await logChannel
                    .send({

                        embeds: [
                            logEmbed
                        ]

                    })
                    .catch(error => {

                        console.error(
                            '⚠️ Kayıt log gönderilemedi:',
                            error
                        );

                    });
            }
        }

        return interaction.reply({

            content:
                `✅ Kayıt başvurun oluşturuldu: ${channel}`,

            ephemeral: true

        });

    } finally {

        kayitCreationLocks.delete(
            lockKey
        );
    }
}

// ==========================================
// KAYIT CLOSE
// ==========================================

async function handleKayitClose(
    interaction
) {

    if (!interaction.channel) {

        return interaction.reply({

            content:
                '❌ Kanal bulunamadı.',

            ephemeral: true

        });
    }

    const channel =
        interaction.channel;

    if (
        !channel.name.startsWith(
            'kayit-'
        )
    ) {

        return interaction.reply({

            content:
                '❌ Bu buton sadece kayıt kanallarında kullanılabilir.',

            ephemeral: true

        });
    }

    const config =
        getGuildConfig(
            interaction.guild.id
        );

    if (!config) {

        return interaction.reply({

            content:
                '❌ Sunucu config bulunamadı.',

            ephemeral: true

        });
    }

    const isStaff =
        interaction.member.roles.cache.has(
            config.kayitStaffRoleId
        );

    const isAdmin =
        interaction.member.permissions.has(
            PermissionFlagsBits.Administrator
        );

    if (
        !isStaff &&
        !isAdmin
    ) {

        return interaction.reply({

            content:
                '❌ Bu kayıt başvurusunu kapatmak için yetkin yok.',

            ephemeral: true

        });
    }

    await interaction.reply({

        content:
            '🔒 Kayıt başvurusu 5 saniye içerisinde kapatılıyor...'

    });

    setTimeout(
        async () => {

            await channel
                .delete()
                .catch(() => {});

        },
        5000
    );
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

        return interaction.update({

            content:
                '❌ Zar savaşı iptal edildi. Meydan okuyan oyuncunun yeterli Cash bakiyesi bulunmuyor.',

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

        return interaction.update({

            content:
                '❌ Zar savaşı iptal edildi. Rakibin yeterli Cash bakiyesi bulunmuyor.',

            embeds: [],

            components: []

        });
    }

    const challengerRemove =
        removeUserMoney(
            battle.challengerId,
            bet
        );

    if (
        !challengerRemove.success
    ) {

        activeBattles.delete(
            battleId
        );

        return interaction.update({

            content:
                '❌ Meydan okuyan oyuncunun Cash işlemi başarısız oldu.',

            embeds: [],

            components: []

        });
    }

    const opponentRemove =
        removeUserMoney(
            battle.opponentId,
            bet
        );

    if (
        !opponentRemove.success
    ) {

        addUserMoney(
            battle.challengerId,
            bet
        );

        activeBattles.delete(
            battleId
        );

        return interaction.update({

            content:
                '❌ Rakibin Cash işlemi başarısız oldu. Bahis iade edildi.',

            embeds: [],

            components: []

        });
    }

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

    let winnerId =
        null;

    let draw =
        false;

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

        draw =
            true;
    }

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

    activeBattles.delete(
        battleId
    );

    activeBattles.delete(
        battle.challengerId
    );

    activeBattles.delete(
        battle.opponentId
    );

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

            `💵 İade edilen bahis: \`${formatMoney(
                bet
            )} Cash\``;

    } else {

        resultTitle =
            '🏆 ZAR SAVAŞI SONUCU!';

        resultColor =
            0x57F287;

        resultDescription =

            '🎲 Büyük zarı atan oyuncu kazandı!\n\n' +

            `🏆 **Kazanan:** <@${winnerId}>\n\n` +

            `💰 **Kazanç:** \`${formatMoney(
                totalPrize
            )} Cash\``;
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
                        `<@${battle.challengerId}>\n🎲 \`${challengerRoll}\``,

                    inline:
                        true

                },

                {

                    name:
                        '🎯 Rakip',

                    value:
                        `<@${battle.opponentId}>\n🎲 \`${opponentRoll}\``,

                    inline:
                        true

                },

                {

                    name:
                        '💵 Bahis',

                    value:
                        `\`${formatMoney(
                            bet
                        )} Cash\``,

                    inline:
                        true

                }

            )

            .setFooter({

                text:
                    'CashBot • Zar Savaşı'

            })

            .setTimestamp();

    return interaction.update({

        content:
            '🎲 Zar savaşı tamamlandı!',

        embeds: [
            resultEmbed
        ],

        components: []

    });
}

// ==========================================
// ENV KONTROL
// ==========================================

if (!process.env.TOKEN) {

    console.error(
        '❌ TOKEN bulunamadı! .env dosyanı kontrol et.'
    );

    process.exit(1);
}

if (!process.env.CLIENT_ID) {

    console.error(
        '❌ CLIENT_ID bulunamadı!'
    );

    process.exit(1);
}

if (!process.env.GUILD_ID) {

    console.error(
        '❌ GUILD_ID bulunamadı!'
    );

    process.exit(1);
}

// ==========================================
// LOGIN
// ==========================================

client.login(
    process.env.TOKEN
);