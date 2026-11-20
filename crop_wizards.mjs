import { Jimp } from 'jimp';
import path from 'path';

const imagePath = "C:\\Users\\Laptop World\\.gemini\\antigravity-ide\\brain\\21c459cd-85d7-4b66-91fd-1e54bd8fe9b6\\media__1782717649576.png";
const outputDir = "c:\\Users\\Laptop World\\Documents\\wepsit-gaming\\public";

async function main() {
  try {
    const image = await Jimp.read(imagePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    console.log(`Image dimensions: ${width}x${height}`);

    // Left side has segment splits: Angry, Like, Crying
    // Right side has splits: Happy, Shocked
    const segments = {
      wizard_angry: { x: 0, y: 0, w: Math.floor(width * 0.5), h: Math.floor(height * 0.345) },
      wizard_like: { x: 0, y: Math.floor(height * 0.345), w: Math.floor(width * 0.5), h: Math.floor(height * 0.321) },
      wizard_crying: { x: 0, y: Math.floor(height * 0.666), w: Math.floor(width * 0.5), h: Math.floor(height * 0.334) },
      
      wizard_happy: { x: Math.floor(width * 0.5), y: 0, w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) },
      wizard_shocked: { x: Math.floor(width * 0.5), y: Math.floor(height * 0.5), w: Math.floor(width * 0.5), h: Math.floor(height * 0.5) }
    };

    for (const [name, rect] of Object.entries(segments)) {
      const cropped = image.clone().crop({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
      
      // Resize to a standard avatar size (e.g. 200x200) to keep it lightweight
      cropped.resize({ w: 200, h: 200 });

      const destPath = path.join(outputDir, `${name}.png`);
      await cropped.write(destPath);
      console.log(`Saved: ${destPath}`);
    }

    console.log("All wizard segments successfully cropped!");
  } catch (error) {
    console.error("Error cropping image:", error);
  }
}

main();
