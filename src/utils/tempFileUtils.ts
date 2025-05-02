// src/utils/tempFileUtils.ts
import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Saves data (e.g., JSON) to a temporary file.
 * @param data The data to save (will be JSON.stringified).
 * @param prefix A prefix for the temporary file name.
 * @returns The path to the temporary file.
 */
export async function saveToTempFile(data: any, prefix: string = "fetched_data_"): Promise<string> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${prefix}${Date.now()}.json`); // Save as JSON for simplicity
  try {
    await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2));
    console.log(`Data saved to temporary file: ${tempFilePath}`);
    return tempFilePath;
  } catch (error) {
    console.error(`Error saving data to temporary file ${tempFilePath}:`, error);
    throw error;
  }
}

/**
 * Deletes a temporary file.
 * @param filePath The path to the temporary file to delete.
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    console.log(`Temporary file deleted: ${filePath}`);
  } catch (error) {
    // Log error but don't necessarily throw, as cleanup failure might not be critical
    console.error(`Error deleting temporary file ${filePath}:`, error);
  }
}

