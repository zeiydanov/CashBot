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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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

    try {
        const command = require(filePath);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        }
    } catch (error) {
        console.error('Komut yuklenemedi: ' + file);
        console.error(error);
    }
}

// ==============================
// BOT HAZIR
// ==============================

client.once('clientReady', () => {
    console.log('=================================');
    console.log('CashBot aktif!');
    console.log('Komut sayisi: ' + client.commands.size);
    console.log('Sunucu sayisi: ' + client.guilds.cache.size);
    console.log('Guild Members Intent: AKTIF');
    console.log('=================================');
});

// ==============================
// INTERACTION
// ==============================

client.on('interactionCreate', async interaction => {

    // ==============================
    // BUTTON
    // ==============================

    if (interaction.isButton()) {

        if (interaction.customId.startsWith('ticket_')) {

            const type = interaction.customId.replace('ticket_', '');

            // ==============================
            // TICKET KAPAT
            // ==============================

            if (type === 'close') {

                await interaction.reply({
                    content: 'Ticket 5 saniye icerisinde kapatiliyor...'
                });

                setTimeout(async () => {
                    await interaction.channel
                        .delete()
                        .catch(() => {});
                }, 5000);

                return;
            }

            // ==============================
            // TICKET KATEGORILERI
            // ==============================

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

            // ==============================
            // ACIK TICKET KONTROLU
            // ==============================

            const existingChannel =
                interaction.guild.channels.cache.find(channel =>
                    channel.type === ChannelType.GuildText &&
                    channel.topic === 'ticket-' + interaction.user.id
                );

            if (existingChannel) {

                await interaction.reply({
                    content:
                        'Zaten acik bir ticketin var: ' +
                        existingChannel,
                    ephemeral: true
                });

                return;
            }

            // ==============================
            // TICKET OLUSTUR
            // ==============================

            let channel;

            try {

                channel =
                    await interaction.guild.channels.create({

                        name:
                            'ticket-' +
                            ticketName +
                            '-' +
                            interaction.user.username,

                        type: ChannelType.GuildText,

                        parent:
                            process.env.TICKET_CATEGORY_ID,

                        topic:
                            'ticket-' +
                            interaction.user.id,

                        permissionOverwrites: [

                            {
                                id: interaction.guild.id,

                                deny: [
                                    PermissionFlagsBits.ViewChannel
                                ]
                            },

                            {
                                id: interaction.user.id,

                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory
                                ]
                            },

                            {
                                id: process.env.TICKET_STAFF_ROLE_ID,

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
                    'Ticket olusturma hatasi:',
                    error
                );

                await interaction.reply({
                    content:
                        'Ticket olusturulamadi. Bot izinlerini kontrol et.',
                    ephemeral: true
                });

                return;
            }

            // ==============================
            // TICKET EMBED
            // ==============================

            const embed =
                new EmbedBuilder()
                    .setTitle('Ticket Olusturuldu')
                    .setDescription(
                        'Merhaba ' +
                        interaction.user +
                        '!\n\n' +
                        'Talebiniz basariyla olusturuldu.\n' +
                        'Yetkililer en kisa surede sizinle ilgilenecektir.\n\n' +
                        'Kategori: **' +
                        ticketName +
                        '**\n\n' +
                        'Ticketi kapatmak icin asagidaki butonu kullanabilirsiniz.'
                    )
                    .setFooter({
                        text: 'CashBot - Destek Sistemi'
                    })
                    .setTimestamp();

            // ==============================
            // KAPAT BUTONU
            // ==============================

            const closeButton =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_close')
                            .setLabel('Ticket Kapat')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Danger)
                    );

            // ==============================
            // TICKET MESAJI
            // ==============================

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
                    'Ticket olusturuldu: ' +
                    channel,

                ephemeral: true
            });

            return;
        }
    }

    // ==============================
    // SLASH COMMAND
    // ==============================

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

        await command.execute(interaction);

    } catch (error) {

        console.error(
            'Komut hatasi:',
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({

                content:
                    'Komut calistirilirken bir hata olustu.',

                ephemeral: true
            });

        } else {

            await interaction.reply({

                content:
                    'Komut calistirilirken bir hata olustu.',

                ephemeral: true
            });
        }
    }
});

// ==============================
// BOTU BASLAT
// ==============================

client.login(process.env.TOKEN);