import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// Configure FFmpeg to use static binary (works on Vercel)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Helper to download file or decode base64 to temp path
async function downloadFile(url: string, outputPath: string) {
  // Handle base64 data URLs (e.g., from Upload or Crop nodes)
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 data URL format');
    
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return;
  }
  
  // Handle regular URLs
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

export async function runFFmpeg(payload: { 
    operation: "crop" | "extract"; 
    inputUrl: string; 
    params?: { 
      x?: string | number; 
      y?: string | number; 
      width?: string | number; 
      height?: string | number; 
      timestamp?: string | number; 
    } 
  }) {
    const { operation, inputUrl, params } = payload;
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input-${Date.now()}`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.png`); // Default to png

    try {
      // 1. Download Input
      console.log("Downloading input...", inputUrl);
      await downloadFile(inputUrl, inputPath);

      // 2. Run FFmpeg
      if (operation === 'extract') {
           let timestamp = params?.timestamp || 0;
           
           // Handle percentage input (e.g. "50%")
           if (typeof timestamp === 'string' && timestamp.endsWith('%')) {
               const percentage = parseFloat(timestamp);
               // Get video duration using ffprobe
               const duration = await new Promise<number>((resolve, reject) => {
                   ffmpeg.ffprobe(inputPath, (err, metadata) => {
                       if (err) reject(err);
                       else resolve(metadata.format.duration || 0);
                   });
               });
               timestamp = duration * (percentage / 100);
           }
           
           // Convert to number if it's a string seconds
           timestamp = Number(timestamp);

           // Alternative simpler extraction
           await new Promise<void>((resolve, reject) => {
               ffmpeg(inputPath)
               .seekInput(timestamp)
               .outputOptions(['-vframes 1'])
               .save(outputPath)
               .on("end", () => resolve())
               .on("error", (err) => reject(err));
           })
      } else {
        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(inputPath);

            if (operation === "crop") {
               const x = params?.x || 0;
               const y = params?.y || 0;
               const w = params?.width || 100;
               const h = params?.height || 100;
               
               // Convert percentages to expressions
               // x, y, w, h are 0-100
               command = command.outputOptions([
                 `-vf crop=iw*(${w}/100):ih*(${h}/100):iw*(${x}/100):ih*(${y}/100)`
               ]);
            }

            command
                .save(outputPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err));
        });
      }

      // 3. Read Output & Return Base64
      const imageBuffer = fs.readFileSync(outputPath);
      const base64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
      
      // Cleanup
      try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch(e) {}

      return {
        output: base64
      };

    } catch (error: any) {
        console.error("FFmpeg Error:", error);
        throw new Error(`FFmpeg processing failed: ${error.message}`);
    }
}
