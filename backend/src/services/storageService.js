const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');
const logger = require('../config/logger');

const supabase = createClient(
  config.database.supabaseUrl,
  config.database.supabaseAnonKey
);

const BUCKET_NAME = 'complaints';

/**
 * Upload a file to Supabase Storage
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadImage(file) {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `images/${fileName}`;

    logger.debug({ filePath }, 'Uploading image to Supabase Storage');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    logger.debug({ publicUrl }, 'Image uploaded successfully');
    return publicUrl;
  } catch (error) {
    logger.error({ error: error.message }, 'Supabase storage upload error');
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

module.exports = {
  uploadImage
};
