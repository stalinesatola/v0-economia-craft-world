-- Seed default banners with 3 positions
UPDATE app_config SET data = '[
  {
    "id": "banner-top",
    "position": "top",
    "enabled": false,
    "imageUrl": "",
    "linkUrl": "",
    "altText": "Banner Topo",
    "adScript": ""
  },
  {
    "id": "banner-sidebar",
    "position": "sidebar",
    "enabled": false,
    "imageUrl": "",
    "linkUrl": "",
    "altText": "Banner Lateral",
    "adScript": ""
  },
  {
    "id": "banner-between",
    "position": "between",
    "enabled": false,
    "imageUrl": "",
    "linkUrl": "",
    "altText": "Banner Entre Seccoes",
    "adScript": ""
  }
]'::jsonb WHERE section = 'banners';
