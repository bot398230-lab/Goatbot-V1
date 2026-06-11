const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const AR_MAP = {
  "1:1": "1024x1024",
  "16:9": "1344x768",
  "9:16": "768x1344",
  "3:4": "768x1024",
  "4:3": "1024x768",
  "2:3": "768x1152",
  "3:2": "1152x768"
};

module.exports = {
  config: {
    name: "anigen",
    aliases: ["anikex"],
    version: "1.0.0",
    author: "Neoaz 🐦",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Generate anime images" },
    category: "ai",
    guide: { en: "{pn} <prompt> [--ar 16:9]" }
  },

  onStart: async function ({ message, args, event, api }) {
    let prompt = args.join(" ").trim();
    if (!prompt) return message.reply("Please provide a prompt.");

    let aspect_ratio = "1:1";
    let size = "1024x1024";

    const arMatch = prompt.match(/--ar\s+(\S+)/i);
    if (arMatch) {
      const requestedAr = arMatch[1];
      if (AR_MAP[requestedAr]) {
        aspect_ratio = requestedAr;
        size = AR_MAP[requestedAr];
      }
      prompt = prompt.replace(arMatch[0], "").trim();
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const response = await axios.post("https://anikex-img-api.onrender.com/v1/images/generations", {
        prompt: prompt,
        model: "anime-art-default",
        n: 1,
        size: size,
        aspect_ratio: aspect_ratio,
        negative_prompt: "",
        response_format: "url"
      }, {
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json"
        },
        timeout: 180000
      });

      const imageUrl = response.data?.data?.[0]?.url;
      if (!imageUrl) throw new Error();

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `anigen_${Date.now()}.png`);

      const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(imgRes.data));

      await message.reply({
        body: `Done - ${aspect_ratio}`,
        attachment: fs.createReadStream(filePath)
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      fs.remove(filePath).catch(() => {});

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};

