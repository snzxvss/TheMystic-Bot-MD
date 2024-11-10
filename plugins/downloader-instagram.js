import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import qs from "qs";

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!args[0]) throw `Uso: ${usedPrefix + command} https://www.instagram.com/reel/C8sWV3Nx_GZ/?igsh=MWZoeTY2cW01Nzg1bQ==`;
  try {
    const result = await instagramGetUrl(args[0]);
    for (let i = 0; i < result.url_list.length; i++) {
      const item = result.media_details[i];
      const tempPath = path.join(__dirname, 'temp', `temp_${i}.${item.type === "image" ? "jpg" : "mp4"}`);
      
      // Descargar el archivo
      await download(item.url, tempPath);

      // Enviar el archivo
      if (item.type === "image") {
        await conn.sendMessage(m.chat, { image: { url: tempPath } }, { quoted: m });
      } else if (item.type === "video") {
        await conn.sendMessage(m.chat, { video: { url: tempPath } }, { quoted: m });
      }

      // Eliminar el archivo temporal
      fs.unlinkSync(tempPath);
    }
  } catch (err) {
    console.error(err);
    throw `Error al descargar el contenido. Asegúrate de que el enlace sea correcto.\n*◉ https://www.instagram.com/reel/C8sWV3Nx_GZ/?igsh=MWZoeTY2cW01Nzg1bQ==`;
  }
};

handler.command = /^(instagramdl|instagram|igdl|ig|instagramdl2|instagram2|igdl2|ig2|instagramdl3|instagram3|igdl3|ig3)$/i;
export default handler;

const download = async (url, filePath) => {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const instagramGetUrl = (url_media) => {
  return new Promise(async (resolve, reject) => {
    try {
      const SHORTCODE = getShortcode(url_media);
      const INSTAGRAM_REQUEST = await instagramRequest(SHORTCODE);
      const OUTPUT_DATA = createOutputData(INSTAGRAM_REQUEST);
      resolve(OUTPUT_DATA);
    } catch (err) {
      reject({
        error: err.message
      });
    }
  });
};

const getShortcode = (url) => {
  try {
    let split_url = url.split("/");
    let post_tags = ["p", "reel", "tv"];
    let index_shortcode = split_url.findIndex(item => post_tags.includes(item)) + 1;
    let shortcode = split_url[index_shortcode];
    return shortcode;
  } catch (err) {
    throw new Error(`Failed to obtain shortcode: ${err.message}`);
  }
};

const instagramRequest = async (shortcode) => {
  try {
    const BASE_URL = "https://www.instagram.com/graphql/query";
    const INSTAGRAM_DOCUMENT_ID = "8845758582119845";
    let dataBody = qs.stringify({
      'variables': JSON.stringify({
        'shortcode': shortcode,
        'fetch_tagged_user_count': null,
        'hoisted_comment_id': null,
        'hoisted_reply_id': null
      }),
      'doc_id': INSTAGRAM_DOCUMENT_ID
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: dataBody
    };

    const { data } = await axios.request(config);
    if (!data.data?.xdt_shortcode_media) throw new Error("Only posts/reels supported, check if your link is valid.");
    return data.data.xdt_shortcode_media;
  } catch (err) {
    throw new Error(`Failed instagram request: ${err.message}`);
  }
};

const createOutputData = (requestData) => {
  try {
    let url_list = [], media_details = [];
    const IS_SIDECAR = isSidecar(requestData);
    if (IS_SIDECAR) {
      // Post with sidecar
      requestData.edge_sidecar_to_children.edges.forEach((media) => {
        media_details.push(formatMediaDetails(media.node));
        if (media.node.is_video) { // Sidecar video item
          url_list.push(media.node.video_url);
        } else { // Sidecar image item
          url_list.push(media.node.display_url);
        }
      });
    } else {
      // Post without sidecar
      media_details.push(formatMediaDetails(requestData));
      if (requestData.is_video) { // Video media
        url_list.push(requestData.video_url);
      } else { // Image media
        url_list.push(requestData.display_url);
      }
    }

    return {
      results_number: url_list.length,
      url_list,
      post_info: formatPostInfo(requestData),
      media_details
    };
  } catch (err) {
    throw new Error(`Failed to create output data: ${err.message}`);
  }
};

const formatPostInfo = (requestData) => {
  try {
    return {
      owner_username: requestData.owner.username,
      owner_fullname: requestData.owner.full_name,
      is_verified: requestData.owner.is_verified,
      is_private: requestData.owner.is_private,
      likes: requestData.edge_media_preview_like.count,
      is_ad: requestData.is_ad
    };
  } catch (err) {
    throw new Error(`Failed to format post info: ${err.message}`);
  }
};

const formatMediaDetails = (mediaData) => {
  try {
    if (mediaData.is_video) {
      return {
        type: "video",
        dimensions: mediaData.dimensions,
        video_view_count: mediaData.video_view_count,
        url: mediaData.video_url,
        thumbnail: mediaData.display_url
      };
    } else {
      return {
        type: "image",
        dimensions: mediaData.dimensions,
        url: mediaData.display_url
      };
    }
  } catch (err) {
    throw new Error(`Failed to format media details: ${err.message}`);
  }
};

const isSidecar = (requestData) => {
  try {
    return requestData["__typename"] == "XDTGraphSidecar";
  } catch (err) {
    throw new Error(`Failed sidecar verification: ${err.message}`);
  }
};