require('dotenv').config();
const express = require('express');
const cors = require('cors');


BigInt.prototype.toJSON = function () { return this.toString(); };

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/superadmin', require('./routes/superadmin'));
app.use('/admin', require('./routes/admin'));
app.use('/restaurants', require('./routes/restaurants'));
app.use('/orders', require('./routes/orders'));
app.use('/driver', require('./routes/driver'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`)); 