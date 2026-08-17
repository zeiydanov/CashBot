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

        } else {

            console.log(
                '⚠️ ' +
                file +
                ' dosyasında data veya execute eksik.'
            );

        }

    } catch (error) {

        console.error(
            '❌ Komut yüklenemedi: ' +
            file
        );

        console.error(error);

    }
}

// ==========================================
// ECONOMY DOSYASI
// ==========================================

const economyPath = path.join(
    __dirname,
    'data',
    'economy.json'
);

function loadEconomy() {

    try {

        if (
            !fs.existsSync(
                path.dirname(economyPath)
            )
        ) {

            fs.mkdirSync(
                path.dirname(economyPath),
                {
                    recursive: true
                }
            );

        }

        if (
            !fs.existsSync(
                economyPath
            )
        ) {

            fs.writeFileSync(
                economyPath,
                '{}'
            );

        }

        return JSON.parse(
            fs.readFileSync(
                economyPath,
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
// ECONOMY KAYDET
// ==========================================

function saveEconomy(data) {

    fs.writeFileSync(
        economyPath,
        JSON.stringify(
            data,
            null,
            4
        )
    );

}

// ==========================================
// KULLANICI EKONOMİ VERİSİ
// ==========================================

function getEconomyUser(
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
// BOT HAZIR
// ==========================================

client.once(
    'clientReady',
    function() {

        console.log(
            '================================='
        );

        console.log(
            'CashBot aktif!'
        );

        console.log(
            'Komut sayisi: ' +
            client.commands.size
        );

        console.log(
            'Sunucu sayisi: ' +
            client.guilds.cache.size
        );

        console.log(
            'Guild Members Intent: AKTIF'
        );

        console.log(
            '================================='
        );

    }
);

// ==========================================
// INTERACTION SİSTEMİ
// ==========================================

client.on(
    'interactionCreate',
    async function(interaction) {

        // ==========================================
        // BUTONLAR
        // ==========================================

        if (interaction.isButton()) {

            // ==========================================
            // ZAR SAVAŞI KABUL / REDDET
            // ==========================================

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

            // ==========================================
            // TICKET
            // ==========================================

            if (
                interaction.customId.startsWith(
                    'ticket_'
                )
            ) {

                const type =
                    interaction.customId.replace(
                        'ticket_',
                        ''
                    );

                // ==========================================
                // TICKET KAPAT
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
                // TICKET KATEGORİLERİ
                // ==========================================

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

                    return;

                }

                // ==========================================
                // AÇIK TICKET KONTROLÜ
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

                // ==========================================
                // TICKET EMBED
                // ==========================================

                const embed =
                    new EmbedBuilder()

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
                                'CashBot - Destek Sistemi'

                        })

                        .setTimestamp();

                // ==========================================
                // KAPAT BUTONU
                // ==========================================

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

                // ==========================================
                // TICKET MESAJI
                // ==========================================

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

                // ==========================================
                // KULLANICIYA BİLGİ
                // ==========================================

                await interaction.reply({

                    content:
                        '✅ Ticket oluşturuldu: ' +
                        channel,

                    ephemeral: true

                });

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

        }

    }
);

// ==========================================
// ZAR SAVAŞI SİSTEMİ
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

    // ==========================================
    // ZAR SAVAŞI KOMUTUNU BUL
    // ==========================================

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

    // ==========================================
    // SAVAŞ BULUNAMADI
    // ==========================================

    if (!battle) {

        return interaction.reply({

            content:
                '❌ Bu zar savaşı artık aktif değil veya süresi dolmuş.',

            ephemeral: true

        });

    }

    // ==========================================
    // SADECE RAKİP CEVAPLAYABİLİR
    // ==========================================

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

        await interaction.update({

            content:
                '❌ Zar savaşı teklifi reddedildi.',

            embeds: [],

            components: []

        });

        return;

    }

    // ==========================================
    // KABUL
    // ==========================================

    battle.accepted = true;

    const data =
        loadEconomy();

    const challengerData =
        getEconomyUser(
            data,
            battle.challengerId
        );

    const opponentData =
        getEconomyUser(
            data,
            battle.opponentId
        );

    const bet =
        Number(
            battle.bet
        );

    // ==========================================
    // İKİ TARAFIN DA PARASI VAR MI?
    // ==========================================

    if (
        challengerData.money < bet
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
        opponentData.money < bet
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
    // BAHİSLERİ DÜŞ
    // ==========================================

    challengerData.money -= bet;

    opponentData.money -= bet;

    saveEconomy(
        data
    );

    // ==========================================
    // ZARLARI AT
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

    let loserId = null;

    let draw = false;

    // ==========================================
    // KAZANAN
    // ==========================================

    if (
        challengerRoll >
        opponentRoll
    ) {

        winnerId =
            battle.challengerId;

        loserId =
            battle.opponentId;

    } else if (
        opponentRoll >
        challengerRoll
    ) {

        winnerId =
            battle.opponentId;

        loserId =
            battle.challengerId;

    } else {

        draw = true;

    }

    // ==========================================
    // KAZANANIN PARASINI VER
    // ==========================================

    if (!draw) {

        const winnerData =
            getEconomyUser(
                data,
                winnerId
            );

        winnerData.money +=
            totalPrize;

        saveEconomy(
            data
        );

    } else {

        // Beraberlikte bahisler geri verilir

        challengerData.money +=
            bet;

        opponentData.money +=
            bet;

        saveEconomy(
            data
        );

    }

    // ==========================================
    // SAVAŞI TEMİZLE
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

    let resultTitle = '';

    let resultDescription = '';

    let resultColor = 0x5865F2;

    if (draw) {

        resultTitle =
            '🤝 ZAR SAVAŞI BERABERE!';

        resultColor =
            0xFEE75C;

        resultDescription =

            '🎲 İki oyuncu da aynı zarı attı!\n\n' +

            '💰 Bahisler iki oyuncuya da geri ödendi.\n\n' +

            '💵 İade edilen bahis: `' +
            bet.toLocaleString(
                'tr-TR'
            ) +
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
            totalPrize.toLocaleString(
                'tr-TR'
            ) +
            ' Cash`';

    }

    // ==========================================
    // SONUÇ EMBED
    // ==========================================

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
    // MESAJI GÜNCELLE
    // ==========================================

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
// BOTU BAŞLAT
// ==========================================

client.login(
    process.env.TOKEN
);