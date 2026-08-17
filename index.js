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
    // KAYIT BUTONU
    // ==============================

    if (interaction.isButton()) {

        if (interaction.customId === 'kayit_baslat') {

            const modal = new ModalBuilder()
                .setCustomId('kayit_formu')
                .setTitle('📋 Kayıt Başvurusu');

            const isim = new TextInputBuilder()
                .setCustomId('kayit_isim')
                .setLabel('İsim / Soyisim')
                .setPlaceholder('Örn: Ahmet Yılmaz')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(50);

            const yas = new TextInputBuilder()
                .setCustomId('kayit_yas')
                .setLabel('Yaş')
                .setPlaceholder('Örn: 21')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(3);

            const oyunId = new TextInputBuilder()
                .setCustomId('kayit_id')
                .setLabel('FiveM / Oyun ID')
                .setPlaceholder('Örn: 12345')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(20);

            const aktiflik = new TextInputBuilder()
                .setCustomId('kayit_aktiflik')
                .setLabel('Günlük Aktiflik')
                .setPlaceholder('Örn: 4-5 saat')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            const deneyim = new TextInputBuilder()
                .setCustomId('kayit_deneyim')
                .setLabel('RP Deneyimin')
                .setPlaceholder('RP deneyimini kısaca anlat.')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(isim),
                new ActionRowBuilder().addComponents(yas),
                new ActionRowBuilder().addComponents(oyunId),
                new ActionRowBuilder().addComponents(aktiflik),
                new ActionRowBuilder().addComponents(deneyim)
            );

            await interaction.showModal(modal);

            return;
        }

        // ==============================
        // KAYIT ONAY
        // ==============================

        if (interaction.customId === 'kayit_onayla') {

            if (
                !interaction.member.roles.cache.has(
                    process.env.KAYIT_STAFF_ROLE_ID
                ) &&
                !interaction.member.permissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.reply({
                    content: '❌ Bu işlemi sadece kayıt yetkilileri yapabilir.',
                    ephemeral: true
                });

                return;
            }

            const channel = interaction.channel;

            const topic = channel.topic || '';

            if (!topic.startsWith('kayit-')) {
                await interaction.reply({
                    content: '❌ Bu kanal bir kayıt kanalı değil.',
                    ephemeral: true
                });

                return;
            }

            const userId = topic.replace('kayit-', '');

            const member = await interaction.guild.members
                .fetch(userId)
                .catch(() => null);

            if (!member) {
                await interaction.reply({
                    content: '❌ Başvuru sahibi artık sunucuda değil.',
                    ephemeral: true
                });

                return;
            }

            const kayitRole =
                interaction.guild.roles.cache.get(
                    process.env.KAYIT_ROLE_ID
                );

            if (!kayitRole) {
                await interaction.reply({
                    content: '❌ Kayıt rolü bulunamadı. KAYIT_ROLE_ID değerini kontrol et.',
                    ephemeral: true
                });

                return;
            }

            try {

                await member.roles.add(kayitRole);

                await interaction.reply({
                    content:
                        '✅ **Kayıt başarıyla onaylandı!**\n' +
                        member +
                        ' kullanıcısına ' +
                        kayitRole +
                        ' rolü verildi.'
                });

                setTimeout(async () => {

                    await channel.delete().catch(() => {});

                }, 5000);

            } catch (error) {

                console.error('Kayıt onaylama hatası:', error);

                await interaction.reply({
                    content:
                        '❌ Kayıt rolü verilemedi. Botun rol hiyerarşisini kontrol et.',
                    ephemeral: true
                });
            }

            return;
        }

        // ==============================
        // KAYIT RED
        // ==============================

        if (interaction.customId === 'kayit_reddet') {

            if (
                !interaction.member.roles.cache.has(
                    process.env.KAYIT_STAFF_ROLE_ID
                ) &&
                !interaction.member.permissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.reply({
                    content: '❌ Bu işlemi sadece kayıt yetkilileri yapabilir.',
                    ephemeral: true
                });

                return;
            }

            await interaction.reply({
                content:
                    '❌ **Kayıt başvurusu reddedildi.**\n' +
                    'Bu kanal 5 saniye içerisinde kapatılacak.'
            });

            setTimeout(async () => {

                await interaction.channel
                    .delete()
                    .catch(() => {});

            }, 5000);

            return;
        }
    }

    // ==============================
    // KAYIT FORMU
    // ==============================

    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'kayit_formu') {

            await interaction.deferReply({
                ephemeral: true
            });

            const isim =
                interaction.fields.getTextInputValue(
                    'kayit_isim'
                );

            const yas =
                interaction.fields.getTextInputValue(
                    'kayit_yas'
                );

            const oyunId =
                interaction.fields.getTextInputValue(
                    'kayit_id'
                );

            const aktiflik =
                interaction.fields.getTextInputValue(
                    'kayit_aktiflik'
                );

            const deneyim =
                interaction.fields.getTextInputValue(
                    'kayit_deneyim'
                );

            // ==============================
            // AYNI KİŞİ KONTROLÜ
            // ==============================

            const existingChannel =
                interaction.guild.channels.cache.find(
                    channel =>
                        channel.type === ChannelType.GuildText &&
                        channel.topic ===
                            'kayit-' +
                            interaction.user.id
                );

            if (existingChannel) {

                await interaction.editReply({
                    content:
                        '❌ Zaten açık bir kayıt başvurun var: ' +
                        existingChannel
                });

                return;
            }

            // ==============================
            // KAYIT KANALI
            // ==============================

            let channel;

            try {

                channel =
                    await interaction.guild.channels.create({

                        name:
                            'kayit-' +
                            interaction.user.username,

                        type: ChannelType.GuildText,

                        parent:
                            process.env.KAYIT_CATEGORY_ID,

                        topic:
                            'kayit-' +
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
                                    process.env.KAYIT_STAFF_ROLE_ID,

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
                    'Kayıt kanalı oluşturma hatası:',
                    error
                );

                await interaction.editReply({
                    content:
                        '❌ Kayıt kanalı oluşturulamadı. Bot izinlerini kontrol et.'
                });

                return;
            }

            // ==============================
            // BAŞVURU EMBED
            // ==============================

            const embed =
                new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('📋 Yeni Kayıt Başvurusu')
                    .setDescription(
                        'Yeni bir oyuncu kayıt başvurusu oluşturuldu.'
                    )
                    .addFields(

                        {
                            name: '👤 İsim / Soyisim',
                            value: isim,
                            inline: false
                        },

                        {
                            name: '🎂 Yaş',
                            value: yas,
                            inline: true
                        },

                        {
                            name: '🎮 FiveM / Oyun ID',
                            value: oyunId,
                            inline: true
                        },

                        {
                            name: '🕐 Günlük Aktiflik',
                            value: aktiflik,
                            inline: false
                        },

                        {
                            name: '📜 RP Deneyimi',
                            value: deneyim,
                            inline: false
                        },

                        {
                            name: '👤 Başvuran',
                            value: interaction.user.toString(),
                            inline: false
                        }

                    )
                    .setFooter({
                        text: 'CashBot • Kayıt Sistemi'
                    })
                    .setTimestamp();

            const buttons =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('kayit_onayla')
                            .setLabel('Onayla')
                            .setEmoji('✅')
                            .setStyle(ButtonStyle.Success),

                        new ButtonBuilder()
                            .setCustomId('kayit_reddet')
                            .setLabel('Reddet')
                            .setEmoji('❌')
                            .setStyle(ButtonStyle.Danger)

                    );

            await channel.send({

                content:
                    '<@&' +
                    process.env.KAYIT_STAFF_ROLE_ID +
                    '> ' +
                    interaction.user,

                embeds: [
                    embed
                ],

                components: [
                    buttons
                ]
            });

            await interaction.editReply({

                content:
                    '✅ Kayıt başvurun oluşturuldu: ' +
                    channel
            });

            return;
        }
    }

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