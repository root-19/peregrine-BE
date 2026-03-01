// For now, we'll skip Firebase Storage and use local file serving
// This can be updated later when Firebase Storage is properly configured
export const uploadToLocal = (file: any, userId: string) => {
  const path = require('path');
  const fs = require('fs');
  
  // Generate a unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const fileName = `profile-${userId}-${uniqueSuffix}.jpg`;
  const uploadDir = path.join(__dirname, '../../uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Move file to uploads directory with new name
  const oldPath = file.path;
  const newPath = path.join(uploadDir, fileName);
  fs.renameSync(oldPath, newPath);
  
  // Return the public URL (server will serve these files)
  return `http://192.168.1.18:3001/uploads/${fileName}`;
};
