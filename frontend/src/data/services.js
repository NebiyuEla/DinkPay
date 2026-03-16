export const services = [
  {
    id: 'dink-test',
    name: 'Dink Test',
    icon: '/icons/chatgpt.svg',
    fallback: 'DT',
    color: '#0b2d22',
    category: 'testing',
    popular: false,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Reference', placeholder: 'Any short note for this test checkout' }
    ],
    plans: [
      { name: '1 ETB Test', price: 1 }
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '/icons/netflix.svg',  // ← SVG path
    fallback: 'N',                // ← Fallback letter if SVG missing
    color: '#000000',
    category: 'streaming',
    popular: true,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Netflix account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Mobile', price: 970 },
      { name: 'Basic', price: 1090 },
      { name: 'Standard', price: 1570 },
      { name: 'Premium', price: 1810 }
    ]
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '/icons/spotify.svg',
    fallback: 'S',
    color: '#1DB954',
    category: 'music',
    popular: true,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Spotify account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Student', price: 275 },
      { name: 'Individual', price: 555 },
      { name: 'Duo', price: 740 },
      { name: 'Family', price: 925 }
    ]
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '/icons/chatgpt.svg',
    fallback: 'C',
    color: '#10A37F',
    category: 'ai',
    popular: true,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'OpenAI account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Plus', price: 3700 },
      { name: 'Pro', price: 34000 }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram Premium',
    icon: '/icons/telegram.svg',
    fallback: 'T',
    color: '#0088cc',
    category: 'social',
    popular: true,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Username', placeholder: '@username' }
    ],
    plans: [
      { name: '3 Months', price: 2100 },
      { name: '6 Months', price: 2800 },
      { name: '12 Months', price: 5000 }
    ]
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    icon: '/icons/youtube.svg',
    fallback: 'Y',
    color: '#FF0000',
    category: 'streaming',
    popular: true,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Google account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Student', price: 180 },
      { name: 'Individual', price: 2590 },
      { name: 'Family', price: 4255 },
      { name: 'Individual Yearly', price: 23800 }
    ]
  },
  {
    id: 'telegram-stars',
    name: 'Telegram Stars',
    icon: '/icons/telegram-stars.svg',
    fallback: '⭐',
    color: '#FFD700',
    category: 'social',
    popular: true,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Username', placeholder: '@username' }
    ],
    plans: [
      { name: '100 Stars', price: 300 },
      { name: '150 Stars', price: 400 },
      { name: '250 Stars', price: 600 },
      { name: '350 Stars', price: 850 },
      { name: '500 Stars', price: 1200 },
      { name: '750 Stars', price: 1700 },
      { name: '1000 Stars', price: 2500 }
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok Coins',
    icon: '/icons/tiktok.svg',
    fallback: 'TT',
    color: '#000000',
    category: 'social',
    popular: true,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'TikTok account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: '350 Coins', price: 925 },
      { name: '700 Coins', price: 1850 },
      { name: '1400 Coins', price: 3700 },
      { name: '3500 Coins', price: 9250 },
      { name: '7000 Coins', price: 17500 },
      { name: '17500 Coins', price: 42500 }
    ]
  },
  {
    id: 'snapchat',
    name: 'Snapchat+',
    icon: '/icons/snapchat.svg',
    fallback: 'SC',
    color: '#FFFC00',
    category: 'social',
    popular: false,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Snapchat username' }
    ],
    plans: [
      { name: '3 Months', price: 2000 },
      { name: '6 Months', price: 4000 },
      { name: '12 Months', price: 6000 }
    ]
  },
  {
    id: 'instagram-verified',
    name: 'Instagram Verified',
    icon: '/icons/instagram.svg',
    fallback: 'IG',
    color: '#E4405F',
    category: 'social',
    popular: true,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Instagram username' }
    ],
    plans: [
      { name: 'Monthly', price: 2400 }
    ]
  },
  {
    id: 'upwork',
    name: 'Upwork Connects',
    icon: '/icons/upwork.svg',
    fallback: 'UW',
    color: '#6FDA44',
    category: 'work',
    popular: false,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Upwork account email' }
    ],
    plans: [
      { name: '100 Connects', price: 3000 },
      { name: '150 Connects', price: 4500 },
      { name: '200 Connects', price: 6000 },
      { name: '250 Connects', price: 7500 },
      { name: '300 Connects', price: 9000 }
    ]
  },
  {
    id: 'playstation',
    name: 'PlayStation Plus',
    icon: '/icons/playstation.svg',
    fallback: 'PS',
    color: '#003791',
    category: 'gaming',
    popular: false,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'PSN account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Essential 1M', price: 1850 },
      { name: 'Essential 3M', price: 4625 },
      { name: 'Essential 12M', price: 14000 },
      { name: 'Extra 1M', price: 2775 },
      { name: 'Extra 3M', price: 7400 },
      { name: 'Extra 12M', price: 22950 },
      { name: 'Premium 1M', price: 3330 },
      { name: 'Premium 3M', price: 9250 },
      { name: 'Premium 12M', price: 27200 }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    icon: '/icons/microsoft.svg',
    fallback: 'MS',
    color: '#00A4EF',
    category: 'software',
    popular: false,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Microsoft account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Home Personal Monthly', price: 1850 },
      { name: 'Business Personal Monthly', price: 2405 },
      { name: 'Home Personal Yearly', price: 17000 },
      { name: 'Business Personal Yearly', price: 22100 }
    ]
  },
  {
    id: 'canva',
    name: 'Canva Pro',
    icon: '/icons/canva.svg',
    fallback: 'CV',
    color: '#00C4CC',
    category: 'design',
    popular: false,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Canva account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Monthly', price: 2770 },
      { name: 'Yearly', price: 20400 }
    ]
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    icon: '/icons/duolingo.svg',
    fallback: 'D',
    color: '#58CC02',
    category: 'education',
    popular: false,
    requiresCredentials: true,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Duolingo account email' }
    ],
    plans: [
      { name: 'One Test', price: 12250 },
      { name: 'Two Tests', price: 20000 }
    ]
  },
  {
    id: 'instagram-services',
    name: 'Instagram Services',
    icon: '/icons/instagram-services.svg',
    fallback: 'IG+',
    color: '#C13584',
    category: 'social',
    popular: true,
    requiresCredentials: false,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Instagram username' }
    ],
    plans: [
      { name: '500 Followers', price: 1 },
      { name: '1200 Followers', price: 2048 },
      { name: '2500 Followers', price: 3898 },
      { name: '6500 Followers', price: 8948 },
      { name: '500 Likes', price: 1123 },
      { name: '1200 Likes', price: 2048 },
      { name: '2500 Likes', price: 3898 },
      { name: '6500 Likes', price: 8948 }
    ]
  }
];

export const getPopularServices = () => services.filter(s => s.popular);
export const getAllServices = () => services;
export const getServiceById = (id) => services.find(s => s.id === id);
export const searchServices = (query) => {
  if (!query) return services;
  return services.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase())
  );
};
