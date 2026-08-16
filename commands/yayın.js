const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

// ===============================
// KANAL ID'LERİ
// ===============================

const GENEL_SOHBET_ID = '1516440180675055766';
const DUYURULAR_ID = '1516438773410300014';

// ===============================
// STREAMER ROLÜ
// ===============================

const STREAMER_ROLE_ID = '1538411702230585434';

// ===============================
// YAYINCILAR
// ===============================

const STREAMERS = {

    // ALTHAR
    '1331088306934517771': {
        name: 'Althar',
        kick: 'https://kick.com/walthar',

        mesaj: (oyun, link) => `
🔴 **YAYIN BAŞLADI!** @everyone

🎥 **Althar** şu anda **${oyun}** yayınına başladı!

🔥 Roleplay, aksiyon ve eğlence için yayına katılmayı unutma!

👀 Yayında neler olacağını kaçırmamak için hemen katıl.

🔗 **YAYIN LİNKİ:** ${link}

💜 İyi seyirler! **ALTHAR SUNAR!**
`
    },

    // TUTKUCANDIR
    '615522831656288256': {
        name: 'TutkuCandır',
        kick: 'https://kick.com/tutkucandir',

        mesaj: (oyun, link) => `
🔴 **YAYIN BAŞLADI!** @everyone

🎥 **TutkuCandır** yayında!

🎮 Bugünün yayını: **${oyun}**

🔥 Eğlence, rekabet ve bolca aksiyon için yayına bekleniyorsun!

👀 Sen de yayına katıl, birlikte eğlenelim!

🔗 **YAYIN LİNKİ:** ${link}

💜 İyi seyirler! **TutkuCandır Sunar!**
`
    }

};

// ===============================
// KOMUT
// ===============================

module.exports = {

    data: new SlashCommandBuilder()
        .setName('yayın')
        .setDescription('Seçilen kişinin yayın duyurusunu gönderir.')

        .addStringOption(option =>
            option
                .setName('oyun')
                .setDescription('Yayın türünü seç')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'League of Legends',
                        value: 'League of Legends'
                    },
                    {
                        name: 'FiveM',
                        value: 'FiveM'
                    },
                    {
                        name: 'Counter-Strike',
                        value: 'Counter-Strike'
                    }
                )
        )

        .addUserOption(option =>
            option
                .setName('kişi')
                .setDescription('Yayını duyurulacak kişi')
                .setRequired(true)
        )

        .setDefaultMemberPermissions(null),

    async execute(interaction) {

        // ===============================
        // YETKİ KONTROLÜ
        // ===============================

        const isAdministrator =
            interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            );

        const isStreamer =
            interaction.member.roles.cache.has(STREAMER_ROLE_ID);

        if (!isAdministrator && !isStreamer) {
            return interaction.reply({
                content:
                    '❌ Bu komutu kullanabilmek için **Streamer** rolüne sahip olmalısın.',
                flags: MessageFlags.Ephemeral
            });
        }

        // ===============================
        // SEÇİMLER
        // ===============================

        const oyun = interaction.options.getString('oyun');
        const kisi = interaction.options.getUser('kişi');

        // ===============================
        // YAYINCI KONTROLÜ
        // ===============================

        const streamer = STREAMERS[kisi.id];

        if (!streamer) {
            return interaction.reply({
                content:
                    `❌ **${kisi.username}** sistemde kayıtlı bir yayıncı değil.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // ===============================
        // DISCORD'A HEMEN CEVAP VER
        // ===============================
        // Discord'un 3 saniyelik interaction
        // süresinin dolmasını engeller.

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        // ===============================
        // MESAJI OLUŞTUR
        // ===============================

        const mesaj = streamer.mesaj(
            oyun,
            streamer.kick
        );

        // ===============================
        // KANALLARA GÖNDER
        // ===============================

        try {

            const genelSohbet =
                await interaction.guild.channels.fetch(
                    GENEL_SOHBET_ID
                );

            const duyurular =
                await interaction.guild.channels.fetch(
                    DUYURULAR_ID
                );

            // GENEL SOHBET
            await genelSohbet.send(mesaj);

            // DUYURULAR
            await duyurular.send(mesaj);

            // KOMUTU KULLANAN KİŞİYE
            await interaction.editReply({
                content:
                    `✅ **${streamer.name}** için **${oyun}** yayın duyurusu başarıyla gönderildi.`
            });

        } catch (error) {

            console.error(
                'Yayın komutu hatası:',
                error
            );

            if (interaction.deferred) {
                await interaction.editReply({
                    content:
                        '❌ Yayın duyurusu gönderilirken bir hata oluştu.'
                });
            }
        }
    }
};