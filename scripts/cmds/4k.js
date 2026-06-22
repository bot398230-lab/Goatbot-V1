const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale", "enhance"],
    version: "1.0.0",
    author: "𝙼𝙸𝚁𝙹𝙰𝙵𝙾𝚁 🐦",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Upscale images to 4k quality" },
    category: "media",
    guide: { en: "{pn} (reply to an image)" }
  },

  onStart: async function ({ message, event, args, api }) {
    let imageUrl = null;

    if (event.type === "message_reply" && event.messageReply.attachments?.length > 0) {
      const att = event.messageReply.attachments[0];
      if (att.type === "photo") imageUrl = att.url;
    } else if (args[0] && args[0].startsWith("http")) {
      imageUrl = args[0];
    }

    if (!imageUrl) {
      return api.setMessageReaction("❌", event.messageID, () => {}, true);
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const form = new FormData();
      form.append("scale", "16");
      form.append("image", "");
      form.append("image_url", imageUrl);

      const response = await axios.post("https://nkximggen.onrender.com/api/enhance", form, {
        headers: {
          ...form.getHeaders(),
          "accept": "application/json"
        },
        timeout: 300000
      });

      const upscaledUrl = response.data?.data?.[0]?.url;
      if (!upscaledUrl) throw new Error();

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `4k_${Date.now()}.png`);

      const imageRes = await axios.get(upscaledUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(imageRes.data));

      await message.reply({
        body: "✅ | Image upscaled",
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      fs.remove(filePath).catch(() => {});

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
