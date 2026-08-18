import fs from 'fs';

const src = 'dist/_locales/_locales';
const dst = 'dist/_locales';

if (fs.existsSync(src)) {
  ['en', 'fr'].forEach(lang => {
    const srcPath = `${src}/${lang}`;
    const dstPath = `${dst}/${lang}`;
    if (fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
      fs.renameSync(srcPath, dstPath);
    }
  });
  fs.rmSync(src, { recursive: true, force: true });
}