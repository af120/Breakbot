const bcrypt = require('bcryptjs');
const hash = '$2b$10$GvEsET0UE.OoN2A3rbXVjeqC3SZOtt4d/a8cTBHPkViycq.f7sonS';
console.log('admin', bcrypt.compareSync('admin', hash));
console.log('admin123', bcrypt.compareSync('admin123', hash));
console.log('password', bcrypt.compareSync('password', hash));
