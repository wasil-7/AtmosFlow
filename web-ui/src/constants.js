export const CAPITAL = 'Islamabad';
export const PROVINCIAL_CAPITALS = ['Karachi', 'Lahore', 'Peshawar', 'Quetta', 'Gilgit', 'Muzaffarabad'];

export const CITY_CODES = {
  'Islamabad': 'ISB', 'Karachi': 'KHI', 'Lahore': 'LHR', 'Peshawar': 'PEW',
  'Quetta': 'QTA', 'Gilgit': 'GIL', 'Muzaffarabad': 'MZD', 'Faisalabad': 'LYP',
  'Rawalpindi': 'RWP', 'Multan': 'MUX', 'Gujranwala': 'GUJ', 'Sialkot': 'SKT',
  'Hyderabad': 'HDD', 'Sukkur': 'SKR', 'Bahawalpur': 'BHV', 'Sargodha': 'SGD',
  'Gwadar': 'GWD', 'Skardu': 'KDU', 'Abbottabad': 'ABT', 'Chitral': 'CJL', 'Mianwali': 'MWL'
};

export const allCityCoords = {
  'Islamabad': [33.6989, 73.0369], 'Karachi': [24.8600, 67.0100],
  'Lahore': [31.5497, 74.3436], 'Peshawar': [34.0144, 71.5675],
  'Quetta': [30.1958, 67.0172], 'Gilgit': [35.9208, 74.3089],
  'Muzaffarabad': [34.3700, 73.4711], 'Faisalabad': [31.4180, 73.0790],
  'Rawalpindi': [33.6007, 73.0679], 'Multan': [30.1978, 71.4711],
  'Gujranwala': [32.1500, 74.1833], 'Sialkot': [32.5000, 74.5333],
  'Hyderabad': [25.3792, 68.3683], 'Sukkur': [27.7052, 68.8574],
  'Bahawalpur': [29.3956, 71.6833], 'Sargodha': [32.0836, 72.6711],
  'Gwadar': [25.1216, 62.3254], 'Skardu': [35.2981, 75.6114],
  'Abbottabad': [34.1463, 73.2117], 'Chitral': [35.8510, 71.7864],
  'Mianwali': [32.5839, 71.5370]
};

export const cities = [
  'Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta', 'Gilgit', 'Muzaffarabad',
  'Abbottabad', 'Bahawalpur', 'Chitral', 'Faisalabad', 'Gujranwala',
  'Gwadar', 'Hyderabad', 'Mianwali', 'Multan', 'Rawalpindi',
  'Sargodha', 'Sialkot', 'Skardu', 'Sukkur'
];

export const AIR_CORRIDORS = [
  { nodes: ['Karachi', 'Quetta'], distance: 686 },
  { nodes: ['Karachi', 'Lahore'], distance: 1022 },
  { nodes: ['Lahore', 'Peshawar'], distance: 376 },
  { nodes: ['Lahore', 'Quetta'], distance: 714 },
  { nodes: ['Lahore', 'Gilgit'], distance: 512 },
  { nodes: ['Quetta', 'Peshawar'], distance: 535 },
  { nodes: ['Peshawar', 'Gilgit'], distance: 501 }
];

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
