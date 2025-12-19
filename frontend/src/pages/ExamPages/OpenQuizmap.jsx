export const FOLDER_NAME_MAP = {
  "khoi-12": "Khối 12",
  "khoi-11": "Khối 11",
  "khoi-10": "Khối 10",
  thptqg: "Thi THPT Quốc Gia",
  "khoi-9": "Khối 9",
  "khoi-5": "Khối 5",
};


export const folderNameFromId = (id) =>
  FOLDER_NAME_MAP[id] || id;
