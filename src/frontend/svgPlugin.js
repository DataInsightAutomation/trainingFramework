import fs from 'fs';
import SVGCompiler from 'svg-baker';
import { optimize } from 'svgo';
import path from 'path';
import glob from 'glob';


const generateSvgSprite = async (iconPaths, outputDir, svgoOptions, symbolIdTemplate, prefix = '') => {
  const svgCompiler = new SVGCompiler();
  const symbols = [];

  // Gather all matched files from specified paths
  const matchedFiles = [];
  for (const iconPath of iconPaths) {
    const files = getAllSvgFiles(iconPath, prefix);
    matchedFiles.push(...files);
  }


  for (const file of matchedFiles) {
    let code;
    try {
      code = await fs.promises.readFile(file, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
      continue; // Skip this file and continue with the next
    }

    // Optimize SVG code if enabled
    if (svgoOptions) {
      const result = optimize(code);
      code = result.data;
    }

    // Generate symbol ID with prefix
    let id = path.basename(file, '.svg');
    if (prefix) {
      id = `${prefix}-${id}`; // Prepend prefix to the ID
    }
    if (symbolIdTemplate) {
      id = symbolIdTemplate.replace('[name]', id);
    }

    // Add symbol to the SVG compiler
    try {
      const symbol = await svgCompiler.addSymbol({
        id,
        content: code,
        path: file,
      });
      symbols.push(symbol.render());
    } catch (error) {
      console.error(`Error adding symbol for ${file}:`, error.message);
      continue; // Skip this file if there's an error
    }
  }

  // Create the SVG sprite
  const spriteContent = `
    <svg>
      <defs>
        ${symbols.join('')}
      </defs>
    </svg>
  `;

  // Write the sprite to the output file
  try {
    await fs.promises.writeFile(outputDir, spriteContent, 'utf-8');
    console.log(`SVG sprite generated at ${outputDir}`);
  } catch (error) {
    console.error(`Error writing SVG sprite to ${outputDir}:`, error.message);
  }
};

// Function to get all SVG files recursively matching the include pattern
const getAllSvgFiles = (iconPath, prefix = '') => {
  try {
    // Normalize the path to ensure it's absolute and consistent
    const resolvedPath = path.resolve(iconPath);
    const searchPattern = prefix
    ? path.join(resolvedPath, '**', `${prefix}*.svg`)
    : path.join(resolvedPath, '**', '*.svg'); // <-- Fixed

    // Use glob to find matching files
    const files = glob.sync(searchPattern, { nodir: true, windowsPathsNoEscape: true });
    return files;
  } catch (error) {
    console.error('Error finding SVG files:', error.message);
    return []; // Return an empty array on failure
  }
};

export { generateSvgSprite };