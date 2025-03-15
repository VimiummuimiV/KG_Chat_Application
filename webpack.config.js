const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Paths
  const headersPath = path.resolve(__dirname, 'src/header.js');
  const outputPath = path.resolve(__dirname, 'dist/KG_Chat_App.js');

  // Update version in header.js if this is a production build
  if (isProduction) {
    try {
      let headerContent = fs.readFileSync(headersPath, 'utf8');
      
      // Extract current version
      const versionMatch = headerContent.match(/\/\/ @version\s+(\d+)\.(\d+)\.(\d+)/);
      if (versionMatch) {
        let major = parseInt(versionMatch[1], 10);
        let minor = parseInt(versionMatch[2], 10);
        let patch = parseInt(versionMatch[3], 10);
        
        // Increment the patch version
        patch++;
        
        // If patch reaches 10, increment minor and reset patch
        if (patch >= 10) {
          minor++;
          patch = 0;
          
          // If minor reaches 10, increment major and reset minor
          if (minor >= 10) {
            major++;
            minor = 0;
          }
        }
        
        const newVersion = `${major}.${minor}.${patch}`;
        
        // Replace the version in the header
        headerContent = headerContent.replace(
          /\/\/ @version\s+\d+\.\d+\.\d+/, 
          `// @version      ${newVersion}`
        );
        
        // Write back to the headers file
        fs.writeFileSync(headersPath, headerContent);
        console.log(`Updated version to ${newVersion}`);
      } else {
        console.warn('Version pattern not found in header.js');
      }
    } catch (error) {
      console.error('Error updating version:', error);
    }
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './main.js', // Main script file
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'KG_Chat_App.js', // Output file name
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    optimization: {
      minimize: isProduction, // Only minify in production
      minimizer: [new TerserPlugin()],
    },
    stats: 'minimal',
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AppendTampermonkeyHeader', () => {
            try {
              const header = fs.readFileSync(headersPath, 'utf8').trim();
              const script = fs.readFileSync(outputPath, 'utf8');
              fs.writeFileSync(outputPath, `${header}\n\n${script}`);
            } catch (error) {
              console.error('Error appending Tampermonkey headers:', error);
            }
          });
        },
      },
    ],
  };
};