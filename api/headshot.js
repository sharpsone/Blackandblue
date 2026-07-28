export default async function handler(req, res) {
  const { id } = req.query;

  const subdomains = ["www", "www2", "www44", "www57"];
  const folders = [
    "player_photos",
    "player_photos_2010",
    "player_photos_2011",
    "player_photos_2012",
    "player_photos_2013",
    "player_photos_2014"
  ];
  const filenames = [
    `${id}.jpg`,
    `${id}_thumb.jpg`,
    `${id}_p.jpg`,
    `${id}_80.jpg`
  ];

  // Try all combinations
  for (const sub of subdomains) {
    for (const folder of folders) {
      for (const file of filenames) {
        const url = `https://${sub}.myfantasyleague.com/${folder}/${file}`;

        try {
          const response = await fetch(url);

          if (response.ok) {
            // Cache headers
            res.setHeader("Cache-Control", "public, max-age=31536000");

            // Pipe the image directly
            const buffer = Buffer.from(await response.arrayBuffer());
            res.setHeader("Content-Type", "image/jpeg");
            return res.status(200).send(buffer);
          }
        } catch (err) {
          // Ignore and continue
        }
      }
    }
  }

  // Fallback silhouette
  const fs = require("fs");
  const path = require("path");
  const fallbackPath = path.join(process.cwd(), "public/silhouettes/player.png");
  const fallbackImage = fs.readFileSync(fallbackPath);

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  return res.status(200).send(fallbackImage);
}
