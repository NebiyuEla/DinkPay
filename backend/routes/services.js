// ALL SERVICES WITH POPULAR FLAG
export const services = [
  // Netflix - Popular
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '🎬',
    color: '#E50914',
    category: 'streaming',
    popular: true,
    usageCount: 15420,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Netflix account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Mobile', price: 970, quality: '480p', devices: '1 device' },
      { name: 'Basic', price: 1090, quality: '720p', devices: '2 devices' },
      { name: 'Standard', price: 1570, quality: '1080p', devices: '4 devices' },
      { name: 'Premium', price: 1810, quality: '4K', devices: '6 devices' }
    ]
  },
  
  // Spotify - Popular
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    color: '#1DB954',
    category: 'music',
    popular: true,
    usageCount: 12350,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Spotify account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Student', price: 275, duration: 'month' },
      { name: 'Individual', price: 555, duration: 'month' },
      { name: 'Duo', price: 740, duration: 'month' },
      { name: 'Family', price: 925, duration: 'month' }
    ]
  },

  // ChatGPT - Popular
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '🤖',
    color: '#10A37F',
    category: 'ai',
    popular: true,
    usageCount: 9870,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'OpenAI account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Plus', price: 3700, duration: 'month' },
      { name: 'Pro', price: 34000, duration: 'month' }
    ]
  },

  // Telegram Premium - Popular
  {
    id: 'telegram',
    name: 'Telegram Premium',
    icon: '✈️',
    color: '#0088cc',
    category: 'social',
    popular: true,
    usageCount: 8760,
    inputs: [
      { type: 'text', label: 'Username', placeholder: '@username or phone number' }
    ],
    plans: [
      { name: '3 Months', price: 2100 },
      { name: '6 Months', price: 2800 },
      { name: '12 Months', price: 5000 }
    ]
  },

  // YouTube Premium - Popular
  {
    id: 'youtube',
    name: 'YouTube Premium',
    icon: '▶️',
    color: '#FF0000',
    category: 'streaming',
    popular: true,
    usageCount: 7650,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Google account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Student', price: 180, duration: 'month' },
      { name: 'Individual', price: 2590, duration: 'month' },
      { name: 'Family', price: 4255, duration: 'month' },
      { name: 'Individual Yearly', price: 23800, duration: 'year' }
    ]
  },

  // Telegram Stars - Popular
  {
    id: 'telegram-stars',
    name: 'Telegram Stars',
    icon: '⭐',
    color: '#FFD700',
    category: 'social',
    popular: true,
    usageCount: 6540,
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

  // Instagram Services - Popular
  {
    id: 'instagram-services',
    name: 'Instagram Services',
    icon: '📸',
    color: '#C13584',
    category: 'social',
    popular: true,
    usageCount: 5430,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Instagram username' }
    ],
    plans: [
      { name: '500 Followers', price: 1123 },
      { name: '1200 Followers', price: 2048 },
      { name: '2500 Followers', price: 3898 },
      { name: '6500 Followers', price: 8948 },
      { name: '500 Likes', price: 1123 },
      { name: '1200 Likes', price: 2048 },
      { name: '2500 Likes', price: 3898 },
      { name: '6500 Likes', price: 8948 }
    ]
  },

  // TikTok Coins
  {
    id: 'tiktok',
    name: 'TikTok Coins',
    icon: '🎵',
    color: '#000000',
    category: 'social',
    popular: false,
    usageCount: 4320,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'TikTok account email' }
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

  // Amazon Prime
  {
    id: 'amazon',
    name: 'Amazon Prime',
    icon: '📦',
    color: '#00A8E1',
    category: 'shopping',
    popular: false,
    usageCount: 3210,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Amazon account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Monthly', price: 550 },
      { name: 'Yearly', price: 4500 }
    ]
  },

  // Canva Pro
  {
    id: 'canva',
    name: 'Canva Pro',
    icon: '🎨',
    color: '#00C4CC',
    category: 'design',
    popular: false,
    usageCount: 2980,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Canva account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Monthly', price: 2770 },
      { name: 'Yearly', price: 20400 }
    ]
  },

  // PlayStation Plus
  {
    id: 'playstation',
    name: 'PlayStation Plus',
    icon: '🎮',
    color: '#003791',
    category: 'gaming',
    popular: false,
    usageCount: 2650,
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

  // Snapchat+
  {
    id: 'snapchat',
    name: 'Snapchat+',
    icon: '👻',
    color: '#FFFC00',
    category: 'social',
    popular: false,
    usageCount: 2340,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Snapchat username' }
    ],
    plans: [
      { name: '3 Months', price: 2000 },
      { name: '6 Months', price: 4000 },
      { name: '12 Months', price: 6000 }
    ]
  },

  // Microsoft 365
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    icon: '💻',
    color: '#00A4EF',
    category: 'software',
    popular: false,
    usageCount: 1980,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Microsoft account email' },
      { type: 'password', label: 'Password', placeholder: 'Account password' }
    ],
    plans: [
      { name: 'Home Personal Monthly', price: 1850 },
      { name: 'Business Monthly', price: 2405 },
      { name: 'Home Personal Yearly', price: 17000 },
      { name: 'Business Yearly', price: 22100 }
    ]
  },

  // Duolingo
  {
    id: 'duolingo',
    name: 'Duolingo',
    icon: '🦉',
    color: '#58CC02',
    category: 'education',
    popular: false,
    usageCount: 1650,
    inputs: [
      { type: 'email', label: 'Email', placeholder: 'Duolingo account email' }
    ],
    plans: [
      { name: 'One Test', price: 12250 },
      { name: 'Two Tests', price: 20000 }
    ]
  },

  // Instagram Verified
  {
    id: 'instagram-verified',
    name: 'Instagram Verified',
    icon: '✅',
    color: '#E4405F',
    category: 'social',
    popular: false,
    usageCount: 1430,
    inputs: [
      { type: 'text', label: 'Username', placeholder: 'Instagram username' }
    ],
    plans: [
      { name: 'Monthly', price: 2400 }
    ]
  },

  // Upwork Connects
  {
    id: 'upwork',
    name: 'Upwork Connects',
    icon: '💼',
    color: '#6FDA44',
    category: 'work',
    popular: false,
    usageCount: 1230,
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

  // Application Fee
  {
    id: 'application-fee',
    name: 'Application Fee',
    icon: '📝',
    color: '#6B7280',
    category: 'fees',
    popular: false,
    usageCount: 980,
    inputs: [
      { type: 'text', label: 'Details', placeholder: 'Application details' },
      { type: 'text', label: 'Amount', placeholder: 'Fee amount' }
    ],
    plans: [
      { name: 'University', price: 1500 },
      { name: 'Visa', price: 2000 },
      { name: 'Custom', price: 0 }
    ]
  },

  // Italy Payments
  {
    id: 'italy',
    name: 'Italy Payments',
    icon: '🇮🇹',
    color: '#009246',
    category: 'international',
    popular: false,
    usageCount: 760,
    inputs: [
      { type: 'text', label: 'Payment Type', placeholder: 'Insurance/Application/CIMEA' },
      { type: 'text', label: 'Amount', placeholder: 'Amount in EUR' }
    ],
    plans: [
      { name: 'Insurance', price: 0 },
      { name: 'Application', price: 0 },
      { name: 'CIMEA', price: 0 }
    ]
  }
];

// Sort by popularity for display
export const getPopularServices = () => {
  return services.filter(s => s.popular).sort((a, b) => b.usageCount - a.usageCount);
};

export const getAllServices = () => {
  return services.sort((a, b) => {
    // Popular first, then by usage count
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return b.usageCount - a.usageCount;
  });
};

export const getServiceById = (id) => services.find(s => s.id === id);
export const searchServices = (query) => {
  if (!query) return getAllServices();
  return services.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );
};