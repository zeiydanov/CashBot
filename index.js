```js
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

// ==============================
// BOT CLIENT
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,

        // Rol bilgisi için gerekli
        GatewayIntentBits.GuildMembers
    ]
});

// ==============================
// KOMUT SİSTEMİ
// ==============================

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {

    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {

        client.commands.set(
            command.data.name,
            command
        );

    } else {

        console.log(
            `⚠️ ${file} dosyasında data veya execute eksik.`
        );

    }
}

// ==============================
// BOT HAZIR
// ==============================

client.once('clientReady', () => {

    console.log('');
    console.log('=================================');
    console.log(`✅ ${client.user.tag} aktif!`);
    console.log(`📦 ${client.commands.size} komut yüklendi.`);
    console.log(`🏠 ${client.guilds.cache.size} sunucu bağlı.`);
    console.log('👥 Guild Members Intent: AKTİF');
    console.log('=================================');
    console.log('');

});

// ==============================
// INTERACTION SİSTEMİ
// ==============================

client.on('interactionCreate', async interaction => {

    // ==========================================
    // TICKET BUTONLARI
    // ==========================================

    if (interaction.isButton()) {

        // ------------------------------------------
        // TICKET OLUŞTURMA
        // ------------------------------------------

        if (interaction.customId.startsWith('ticket_')) {

            const type = interaction.customId.replace(
                'ticket_',
                ''
            );

            // ------------------------------------------
            // TICKET KAPATMA
            // ------------------------------------------

            if (type === 'close') {

                await interaction.reply({

                    content:
                        '🔒 Ticket 5 saniye içerisinde kapatılıyor...'

                });

                setTimeout(async () => {

                    await interaction.channel
                        .delete()
                        .catch(() => {});

                }, 5000);

                return;
            }

            // ------------------------------------------
            // TICKET KATEGORİLERİ
            // ------------------------------------------

            const categoryNames = {

                destek: 'destek',

                donate: 'donate',

                sikayet: 'sikayet',

                teknik: 'teknik'

            };

            const ticketName = categoryNames[type];

            if (!ticketName) {
                return;
            }

            // ------------------------------------------
            // AÇIK TICKET KONTROLÜ
            // ------------------------------------------

            const existingChannel =
                interaction.guild.channels.cache.find(
                    channel =>
                        channel.type === ChannelType.GuildText &&
                        channel.topic ===
                        `ticket-${interaction.user.id}`
                );

            if (existingChannel) {

                return interaction.reply({

                    content:
                        `❌ Zaten açık bir ticketın var: ${existingChannel}`,

                    ephemeral: true

                });

            }

            // ------------------------------------------
            // TICKET KANALI OLUŞTUR
            // ------------------------------------------

            let channel;

            try {

                channel =
                    await interaction.guild.channels.create({

                        name:
                            `ticket-${ticketName}-${interaction.user.username}`,

                        type:
                            ChannelType.GuildText,

                        parent:
                            process.env.TICKET_CATEGORY_ID,

                        topic:
                            `ticket-${interaction.user.id}`,

                        permissionOverwrites: [

                            // Herkese kapat
                            {
                                id:
                                    interaction.guild.id,

                                deny: [
                                    PermissionFlagsBits.ViewChannel
                                ]
                            },

                            // Ticket sahibi
                            {
                                id:
                                    interaction.user.id,

                                allow: [

                                    PermissionFlagsBits.ViewChannel,

                                    PermissionFlagsBits.SendMessages,

                                    PermissionFlagsBits.ReadMessageHistory

                                ]
                            },

                            // Yetkili rolü
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
                        '❌ Ticket oluşturulamadı. Botun kategori ve kanal izinlerini kontrol et.',

                    ephemeral: true

                });

            }

            // ------------------------------------------
            // TICKET EMBED
            // ------------------------------------------

            const embed =
                new EmbedBuilder()

                    .setTitle('🎫 Ticket Oluşturuldu')

                    .setDescription(

                        `Merhaba ${interaction.user}!\n\n` +

                        `Talebiniz başarıyla oluşturuldu.\n` +

                        `Yetkililer en kısa sürede sizinle ilgilenecektir.\n\n` +

                        `📂 **Kategori:** ${ticketName}\n\n` +

                        `🔒 Ticketı kapatmak için aşağıdaki butonu kullanabilirsiniz.`

                    )

                    .setFooter({

                        text:
                            'CashBot • Destek Sistemi'

                    })

                    .setTimestamp();

            // ------------------------------------------
            // KAPATMA BUTONU
            // ------------------------------------------

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

                            .setEmoji('🔒')

                            .setStyle(
                                ButtonStyle.Danger
                            )

                    );

            // ------------------------------------------
            // TICKET MESAJI
            // ------------------------------------------

            await channel.send({

                content:
                    `${interaction.user} <@&${process.env.TICKET_STAFF_ROLE_ID}>`,

                embeds: [
                    embed
                ],

                components: [
                    closeButton
                ]

            });

            // ------------------------------------------
            // KULLANICIYA BİLGİ
            // ------------------------------------------

            await interaction.reply({

                content:
                    `✅ Ticket oluşturuldu: ${channel}`,

                ephemeral: true

            });

            return;
        }
    }

    // ==========================================
    // SLASH COMMAND
    // ==========================================

    if (!interaction.isChatInputCommand()) {
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

});

// ==============================
// BOTU BAŞLAT
// ==============================

client.login(
    process.env.TOKEN
);
```
